"""
Load sample data from gpt5mini_annotations.csv into Supabase.
Run this after setting up your Supabase database.

Usage:
    python load_sample_data.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')

if not supabase_url or not supabase_key:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "gpt5mini_annotations.csv"


def load_sample_data():
    """Load sample data from CSV into Supabase."""
    
    import pandas as pd
    
    print(f"Loading data from {DATA_FILE}...")
    
    # Read the CSV
    df = pd.read_csv(DATA_FILE)
    
    # Create a sample session
    session_data = {
        'name': 'Sample Classroom Dialogue (GPT-5 Mini Annotations)',
        'transcript_text': f'Sample data with {len(df)} exchanges from gpt5mini_annotations.csv',
        'duration_minutes': max(1, len(df) // 2),
        'metadata': {'source': 'gpt5mini_annotations.csv'}
    }
    
    print("Creating session record...")
    session_result = supabase.table('sessions').insert(session_data).execute()
    session_id = session_result.data[0]['id']
    print(f"Created session: {session_id}")
    
    # Prepare OTR records
    otr_records = []
    seen_indices = set()
    for _, row in df.iterrows():
        # Handle combined response types like "verbal, gestural" -> take first value
        response_type = row['gold_response_type'] if pd.notna(row['gold_response_type']) else None
        if response_type and ',' in response_type:
            response_type = response_type.split(',')[0].strip()
        
        elicitation_type = row['gold_elicitation_type'] if pd.notna(row['gold_elicitation_type']) else None
        if elicitation_type and ',' in elicitation_type:
            elicitation_type = elicitation_type.split(',')[0].strip()
        
        # Skip duplicate exchange_idx values
        exchange_idx = int(row['exchange_idx'])
        if exchange_idx in seen_indices:
            continue
        seen_indices.add(exchange_idx)
        
        otr_record = {
            'session_id': session_id,
            'exchange_idx': exchange_idx,
            'obsid': int(row['OBSID']) if pd.notna(row['OBSID']) else None,
            'student_text': row['student_text'] if pd.notna(row['student_text']) else '',
            'teacher_text': row['teacher_text'] if pd.notna(row['teacher_text']) else '',
            'is_otr': row['gold_is_otr'] == 'yes' if pd.notna(row['gold_is_otr']) else False,
            'elicitation_type': elicitation_type,
            'response_type': response_type,
            'cognitive_depth': row['gold_cognitive_depth'] if pd.notna(row['gold_cognitive_depth']) else None,
            'gold_is_otr': row['gold_is_otr'] == 'yes' if pd.notna(row['gold_is_otr']) else None,
            'gold_elicitation_type': row['gold_elicitation_type'] if pd.notna(row['gold_elicitation_type']) else None,
            'gold_response_type': row['gold_response_type'] if pd.notna(row['gold_response_type']) else None,
            'gold_cognitive_depth': row['gold_cognitive_depth'] if pd.notna(row['gold_cognitive_depth']) else None,
        }
        otr_records.append(otr_record)
    
    # Insert in batches of 100
    print(f"Inserting {len(otr_records)} OTR records in batches...")
    batch_size = 100
    for i in range(0, len(otr_records), batch_size):
        batch = otr_records[i:i + batch_size]
        supabase.table('otrs').insert(batch).execute()
        print(f"  Inserted {min(i + batch_size, len(otr_records))} / {len(otr_records)}")
    
    print(f"\n✓ Successfully loaded sample data!")
    print(f"  Session ID: {session_id}")
    print(f"  Total OTRs: {len(otr_records)}")
    print(f"\nAccess the dashboard at: /sessions/{session_id}")


if __name__ == '__main__':
    load_sample_data()
