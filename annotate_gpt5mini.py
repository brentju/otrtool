"""
Annotate consolidated_annotations.csv with GPT-5 mini for OTR classification,
then evaluate predictions against gold-standard human labels.

Usage:
    python scripts/annotate_gpt5mini.py
"""

import json
import sys
import time
import random
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from openai import RateLimitError, APIConnectionError, APIStatusError
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from tenacity import retry, retry_if_exception_type,stop_after_attempt, wait_random_exponential
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "consolidated_annotations.csv"
PROMPT_FILE = ROOT / "annotate.prompt"
OUTPUT_FILE = ROOT / "gpt5mini_annotations.csv"
EVAL_FILE = ROOT / "gpt5mini_eval.csv"

ANNOTATION_FIELDS = ["is_otr", "elicitation_type", "response_type", "cognitive_depth"]
MODEL = "gpt-5-mini"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
load_dotenv(ROOT / ".env")
client = OpenAI()  # picks up OPENAI_API_KEY from env


def load_system_prompt() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


# -------------------------
# Lightweight rate limiter
# -------------------------
@dataclass
class RateLimiter:
    min_interval_s: float = 0.8  # tune this (0.5–1.5s typical)
    _last_t: float = 0.0

    def wait(self):
        now = time.time()
        dt = now - self._last_t
        if dt < self.min_interval_s:
            time.sleep(self.min_interval_s - dt)
        self._last_t = time.time()

rate_limiter = RateLimiter(min_interval_s=0.8)


def _retry_after_seconds(err: Exception) -> float | None:
    """
    If the SDK exposes headers on the exception, respect Retry-After.
    (Availability can vary by SDK version / error type.)
    """
    # Best-effort; safely returns None if not available
    resp = getattr(err, "response", None)
    headers = getattr(resp, "headers", None) if resp is not None else None
    if headers:
        ra = headers.get("retry-after") or headers.get("Retry-After")
        if ra:
            try:
                return float(ra)
            except ValueError:
                return None
    return None


@retry(
    retry=(
        retry_if_exception_type(RateLimitError)
        | retry_if_exception_type(APIConnectionError)
        | retry_if_exception_type(APIStatusError)
        | retry_if_exception_type(json.JSONDecodeError)
    ),
    wait=wait_random_exponential(min=2, max=60),  # exponential backoff + jitter
    stop=stop_after_attempt(8),
    reraise=True,
)
def call_gpt5mini(system_prompt: str, student_text: str, teacher_text: str) -> dict:
    # proactive pacing (prevents constant 429s)
    rate_limiter.wait()

    user_message = (
        f"Student utterance:\n{student_text}\n\n"
        f"Teacher utterance:\n{teacher_text}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=1,
        )
    except RateLimitError as e:
        # If server tells you how long to wait, do it, then re-raise to retry.
        ra = _retry_after_seconds(e)
        if ra is not None:
            time.sleep(ra + random.uniform(0, 0.5))
        raise

    content = response.choices[0].message.content
    return json.loads(content)  # JSONDecodeError will be retried


def normalize(value: str | None) -> str:
    """Lowercase, strip, and normalise whitespace for comparison."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    return str(value).strip().lower()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    # Load data
    df = pd.read_csv(DATA_FILE)
    system_prompt = load_system_prompt()
    print(f"Loaded {len(df)} rows from {DATA_FILE.name}")

    # Resume support: load existing predictions if available
    if OUTPUT_FILE.exists():
        existing = pd.read_csv(OUTPUT_FILE)
        done_ids = set(existing["exchange_idx"].astype(str))
        print(f"Resuming — {len(done_ids)} rows already annotated")
    else:
        existing = None
        done_ids = set()

    # Annotate
    new_rows = []
    total = len(df)
    for i, row in df.iterrows():
        eidx = str(row["exchange_idx"])
        if eidx in done_ids:
            continue

        print(f"[{i+1}/{total}] Annotating {eidx} ... ", end="", flush=True)
        try:
            pred = call_gpt5mini(
                system_prompt,
                str(row.get("student_text", "")),
                str(row.get("teacher_text", "")),
            )
        except Exception as e:
            print(f"FAILED ({e})")
            pred = {f: None for f in ANNOTATION_FIELDS}

        new_rows.append(
            {
                "exchange_idx": row["exchange_idx"],
                "OBSID": row["OBSID"],
                "student_text": row["student_text"],
                "teacher_text": row["teacher_text"],
                # Gold labels
                "gold_is_otr": row["is_otr"],
                "gold_elicitation_type": row["elicitation_type"],
                "gold_response_type": row["response_type"],
                "gold_cognitive_depth": row["cognitive_depth"],
                # GPT predictions
                "pred_is_otr": pred.get("is_otr"),
                "pred_elicitation_type": pred.get("elicitation_type"),
                "pred_response_type": pred.get("response_type"),
                "pred_cognitive_depth": pred.get("cognitive_depth"),
            }
        )
        print("OK")

        # Incremental save every 10 rows
        if len(new_rows) % 10 == 0:
            _save_partial(existing, new_rows)

    # Final save
    results_df = _save_partial(existing, new_rows)
    print(f"\nSaved {len(results_df)} annotated rows to {OUTPUT_FILE.name}")

    # Evaluate
    evaluate(results_df)


def _save_partial(existing: pd.DataFrame | None, new_rows: list[dict]) -> pd.DataFrame:
    new_df = pd.DataFrame(new_rows)
    if existing is not None and not existing.empty:
        combined = pd.concat([existing, new_df], ignore_index=True)
    else:
        combined = new_df
    combined.to_csv(OUTPUT_FILE, index=False)
    return combined


# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------
def evaluate(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("EVALUATION RESULTS")
    print("=" * 60)

    eval_rows = []

    for field in ANNOTATION_FIELDS:
        gold_col = f"gold_{field}"
        pred_col = f"pred_{field}"

        # Only evaluate rows where both gold and pred are non-empty
        mask = df[gold_col].notna() & df[pred_col].notna()
        subset = df[mask].copy()
        if subset.empty:
            continue

        gold = subset[gold_col].apply(normalize)
        pred = subset[pred_col].apply(normalize)

        # Drop rows where gold is empty (e.g. non-OTR rows for sub-fields)
        valid = (gold != "") & (pred != "")
        gold = gold[valid]
        pred = pred[valid]

        acc = accuracy_score(gold, pred)
        n = len(gold)

        eval_rows.append({"field": field, "n": n, "accuracy": round(acc, 4)})
        print(f"\n--- {field} (n={n}) ---")
        print(f"Accuracy: {acc:.2%}")

        # Detailed report for is_otr
        if field == "is_otr":
            labels = sorted(gold.unique())
            print("\nConfusion Matrix:")
            cm = confusion_matrix(gold, pred, labels=labels)
            cm_df = pd.DataFrame(cm, index=labels, columns=labels)
            print(cm_df.to_string())
            print("\nClassification Report:")
            print(classification_report(gold, pred, labels=labels, zero_division=0))

    eval_df = pd.DataFrame(eval_rows)
    eval_df.to_csv(EVAL_FILE, index=False)
    print(f"\nEvaluation saved to {EVAL_FILE.name}")


if __name__ == "__main__":
    main()
