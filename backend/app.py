"""
Flask API for OTR Tool Backend
"""
import os
import csv
import io
import json
import time
from pathlib import Path
from typing import Dict, Any

import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI

# Load environment variables
load_dotenv(Path(__file__).parent.parent / ".env")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

# Initialize OpenAI client
openai_client = OpenAI()

# Load annotation prompt
PROMPT_FILE = Path(__file__).parent.parent / "annotate.prompt"
ANNOTATION_SYSTEM_PROMPT = PROMPT_FILE.read_text(encoding="utf-8") if PROMPT_FILE.exists() else ""


def annotate_with_openai(student_text: str, teacher_text: str) -> Dict[str, Any]:
    """
    Call OpenAI API to annotate a teacher utterance for OTRs.
    Returns the prediction as a dict with keys: is_otr, elicitation_type, response_type, cognitive_depth
    """
    try:
        user_message = (
            f"Student utterance:\n{student_text}\n\n"
            f"Teacher utterance:\n{teacher_text}"
        )

        response = openai_client.chat.completions.create(
            model="gpt-5-mini",
            messages=[
                {"role": "system", "content": ANNOTATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        return json.loads(content)
    except Exception as e:
        print(f"OpenAI annotation error: {e}")
        return {
            "is_otr": "no",
            "elicitation_type": None,
            "response_type": None,
            "cognitive_depth": None,
        }


def parse_transcript(file_content: str, filename: str) -> list[Dict[str, Any]]:
    """
    Parse uploaded transcript file into structured exchanges.
    Supports CSV format with columns: exchange_idx, OBSID, student_text, teacher_text, etc.
    """
    exchanges = []
    seen_indices = set()

    if filename.endswith('.csv'):
        # Parse CSV format (matching gpt5mini_annotations.csv structure)
        reader = csv.DictReader(io.StringIO(file_content))
        for row in reader:
            # Handle combined response types like "verbal, gestural" -> take first value
            response_type = row.get('gold_response_type') or None
            if response_type and ',' in response_type:
                response_type = response_type.split(',')[0].strip()
            
            elicitation_type = row.get('gold_elicitation_type') or None
            if elicitation_type and ',' in elicitation_type:
                elicitation_type = elicitation_type.split(',')[0].strip()
            
            # Skip duplicate exchange_idx values
            exchange_idx = int(row.get('exchange_idx', 0))
            if exchange_idx in seen_indices:
                continue
            seen_indices.add(exchange_idx)
            
            exchange = {
                'exchange_idx': exchange_idx,
                'obsid': int(row.get('OBSID', 0)) if row.get('OBSID') else None,
                'student_text': row.get('student_text', ''),
                'teacher_text': row.get('teacher_text', ''),
                'is_otr': row.get('gold_is_otr') == 'yes' if row.get('gold_is_otr') else False,
                'elicitation_type': elicitation_type,
                'response_type': response_type,
                'cognitive_depth': row.get('gold_cognitive_depth') or None,
            }
            exchanges.append(exchange)
    else:
        # Parse plain text format (simple speaker: text format)
        lines = file_content.strip().split('\n')
        current_student = ''
        idx = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            if line.lower().startswith('student'):
                if current_student:
                    exchanges.append({
                        'exchange_idx': idx,
                        'obsid': None,
                        'student_text': current_student,
                        'teacher_text': '',
                        'is_otr': False,
                        'elicitation_type': None,
                        'response_type': None,
                        'cognitive_depth': None,
                    })
                    idx += 1
                current_student = line.split(':', 1)[1].strip() if ':' in line else line
            elif line.lower().startswith('teacher'):
                teacher_text = line.split(':', 1)[1].strip() if ':' in line else line
                exchanges.append({
                    'exchange_idx': idx,
                    'obsid': None,
                    'student_text': current_student,
                    'teacher_text': teacher_text,
                    'is_otr': False,  # Would need annotation
                    'elicitation_type': None,
                    'response_type': None,
                    'cognitive_depth': None,
                })
                current_student = ''
                idx += 1
        
        # Handle last student turn if exists
        if current_student:
            exchanges.append({
                'exchange_idx': idx,
                'obsid': None,
                'student_text': current_student,
                'teacher_text': '',
                'is_otr': False,
                'elicitation_type': None,
                'response_type': None,
                'cognitive_depth': None,
            })
    
    return exchanges


def estimate_duration(exchanges: list) -> int:
    """
    Estimate session duration in minutes based on number of exchanges.
    Rough estimate: 1 exchange ≈ 30 seconds of classroom time.
    """
    return max(1, len(exchanges) // 2)


def parse_transcript_for_annotation(file_content: str, filename: str) -> list[Dict[str, Any]]:
    """
    Parse uploaded transcript file into structured exchanges for annotation.
    Extracts student_text and teacher_text pairs without any pre-existing labels.
    """
    exchanges = []
    seen_indices = set()

    if filename.endswith('.csv'):
        # Parse CSV format - extract student and teacher text
        reader = csv.DictReader(io.StringIO(file_content))
        for row in reader:
            # Skip duplicate exchange_idx values
            exchange_idx = int(row.get('exchange_idx', 0))
            if exchange_idx in seen_indices:
                continue
            seen_indices.add(exchange_idx)

            exchange = {
                'exchange_idx': exchange_idx,
                'obsid': int(row.get('OBSID', 0)) if row.get('OBSID') else None,
                'student_text': row.get('student_text', ''),
                'teacher_text': row.get('teacher_text', ''),
            }
            exchanges.append(exchange)
    else:
        # Parse plain text format (simple speaker: text format)
        lines = file_content.strip().split('\n')
        current_student = ''
        idx = 0

        for line in lines:
            line = line.strip()
            if not line:
                continue

            if line.lower().startswith('student'):
                if current_student:
                    exchanges.append({
                        'exchange_idx': idx,
                        'obsid': None,
                        'student_text': current_student,
                        'teacher_text': '',
                    })
                    idx += 1
                current_student = line.split(':', 1)[1].strip() if ':' in line else line
            elif line.lower().startswith('teacher'):
                teacher_text = line.split(':', 1)[1].strip() if ':' in line else line
                exchanges.append({
                    'exchange_idx': idx,
                    'obsid': None,
                    'student_text': current_student,
                    'teacher_text': teacher_text,
                })
                current_student = ''
                idx += 1

        # Handle last student turn if exists
        if current_student:
            exchanges.append({
                'exchange_idx': idx,
                'obsid': None,
                'student_text': current_student,
                'teacher_text': '',
            })

    return exchanges


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


@app.route('/api/upload', methods=['POST'])
def upload_transcript():
    """
    Upload and process a transcript file.
    Parses the file, calls OpenAI API to annotate OTRs, and stores results.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        session_name = request.form.get('name', file.filename)

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Read file content
        content = file.read().decode('utf-8')

        # Parse transcript to get student/teacher text pairs
        exchanges = parse_transcript_for_annotation(content, file.filename)

        if not exchanges:
            return jsonify({'error': 'No valid exchanges found in file'}), 400

        # Estimate duration
        duration = estimate_duration(exchanges)

        # Create session record
        session_data = {
            'name': session_name,
            'transcript_text': content,
            'duration_minutes': duration,
        }

        session_result = supabase.table('sessions').insert(session_data).execute()
        session_id = session_result.data[0]['id']

        # Annotate each exchange with OpenAI API
        print(f"Annotating {len(exchanges)} exchanges with OpenAI API...")
        otr_records = []
        for i, exchange in enumerate(exchanges):
            # Call OpenAI to annotate
            pred = annotate_with_openai(
                exchange['student_text'],
                exchange['teacher_text']
            )

            # Convert prediction to database format
            is_otr = pred.get('is_otr', 'no').lower() == 'yes'
            otr_record = {
                'session_id': session_id,
                'exchange_idx': exchange['exchange_idx'],
                'obsid': exchange.get('obsid'),
                'student_text': exchange['student_text'],
                'teacher_text': exchange['teacher_text'],
                'is_otr': is_otr,
                'elicitation_type': pred.get('elicitation_type'),
                'response_type': pred.get('response_type'),
                'cognitive_depth': pred.get('cognitive_depth'),
            }
            otr_records.append(otr_record)

            # Progress logging
            if (i + 1) % 10 == 0:
                print(f"  Annotated {i + 1}/{len(exchanges)} exchanges...")

        # Insert all OTRs
        if otr_records:
            supabase.table('otrs').insert(otr_records).execute()

        # Return session info
        return jsonify({
            'id': session_id,
            'name': session_name,
            'created_at': session_result.data[0]['created_at'],
            'duration_minutes': duration,
            'exchange_count': len(exchanges),
            'otrs_detected': sum(1 for r in otr_records if r['is_otr']),
        }), 201

    except Exception as e:
        print(f"Upload error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions', methods=['GET'])
def get_sessions():
    """Get all sessions"""
    try:
        result = supabase.table('sessions').select('*').order('created_at', desc=True).execute()
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id: str):
    """Get a single session by ID"""
    try:
        result = supabase.table('sessions').select('*').eq('id', session_id).execute()
        if not result.data:
            return jsonify({'error': 'Session not found'}), 404
        return jsonify(result.data[0]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>/metrics', methods=['GET'])
def get_session_metrics(session_id: str):
    """Get aggregated metrics for a session"""
    try:
        # Call the PostgreSQL function
        result = supabase.rpc('get_session_metrics', {'p_session_id': session_id}).execute()
        
        if result.data:
            return jsonify(result.data), 200
        else:
            # Fallback: calculate manually
            otrs_result = supabase.table('otrs').select('*').eq('session_id', session_id).execute()
            reasoning_result = supabase.table('student_reasoning').select('*').eq('session_id', session_id).eq('has_reasoning', True).execute()
            session_result = supabase.table('sessions').select('duration_minutes').eq('id', session_id).execute()
            
            otrs = [o for o in otrs_result.data if o.get('is_otr')]
            
            elicitation_dist = {}
            response_dist = {}
            depth_dist = {}
            
            for otr in otrs:
                if otr.get('elicitation_type'):
                    elicitation_dist[otr['elicitation_type']] = elicitation_dist.get(otr['elicitation_type'], 0) + 1
                if otr.get('response_type'):
                    response_dist[otr['response_type']] = response_dist.get(otr['response_type'], 0) + 1
                if otr.get('cognitive_depth'):
                    depth_dist[otr['cognitive_depth']] = depth_dist.get(otr['cognitive_depth'], 0) + 1
            
            duration = session_result.data[0]['duration_minutes'] if session_result.data and session_result.data[0].get('duration_minutes') else 1
            
            metrics = {
                'total_otrs': len(otrs),
                'otrs_per_minute': len(otrs) / duration,
                'authentic_otrs': sum(1 for o in otrs if o.get('cognitive_depth') == 'authentic'),
                'student_reasoning_count': len(reasoning_result.data),
                'elicitation_distribution': elicitation_dist,
                'response_type_distribution': response_dist,
                'cognitive_depth_distribution': depth_dist,
            }
            
            return jsonify(metrics), 200
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>/otrs', methods=['GET'])
def get_session_otrs(session_id: str):
    """Get all OTRs for a session"""
    try:
        result = supabase.table('otrs').select('*').eq('session_id', session_id).order('exchange_idx').execute()
        return jsonify(result.data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>/annotate', methods=['POST'])
def annotate_student_reasoning(session_id: str):
    """
    Trigger EduConvoKit to annotate student reasoning for a session.
    """
    try:
        # Get session transcript data
        otrs_result = supabase.table('otrs').select('exchange_idx, student_text, teacher_text').eq('session_id', session_id).order('exchange_idx').execute()
        
        if not otrs_result.data:
            return jsonify({'error': 'No data to annotate'}), 400
        
        # Build dataframe for EduConvoKit
        # Format: [ID, sentence, speaker]
        data = []
        for otr in otrs_result.data:
            if otr.get('student_text'):
                data.append({
                    'ID': otr['exchange_idx'],
                    'sentence': otr['student_text'],
                    'speaker': 'Student'
                })
            if otr.get('teacher_text'):
                data.append({
                    'ID': otr['exchange_idx'],
                    'sentence': otr['teacher_text'],
                    'speaker': 'Teacher'
                })
        
        df = pd.DataFrame(data)
        
        # Use EduConvoKit to annotate student reasoning
        from edu_convokit.annotation import Annotator
        
        annotator = Annotator()
        df = annotator.get_student_reasoning(
            df=df,
            speaker_column='speaker',
            text_column='sentence',
            output_column='student_reasoning',
        )
        
        # Store results in database
        reasoning_records = []
        for _, row in df.iterrows():
            if row['speaker'] == 'Student':
                reasoning_records.append({
                    'session_id': session_id,
                    'utterance_id': int(row['ID']),
                    'speaker': row['speaker'],
                    'text': row['sentence'],
                    'has_reasoning': bool(row['student_reasoning']),
                })
        
        if reasoning_records:
            # Upsert to handle duplicates
            supabase.table('student_reasoning').upsert(reasoning_records).execute()
        
        return jsonify({
            'status': 'success',
            'annotated_count': len(reasoning_records),
        }), 200
        
    except ImportError:
        # EduConvoKit not available - simulate for development
        print("EduConvoKit not installed, using mock annotation")
        return jsonify({
            'status': 'success',
            'annotated_count': 0,
            'message': 'Mock annotation (EduConvoKit not installed)',
        }), 200
        
    except Exception as e:
        print(f"Annotation error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/sessions/<session_id>', methods=['DELETE'])
def delete_session(session_id: str):
    """Delete a session and all related data"""
    try:
        # Delete session (cascade will handle otrs and student_reasoning)
        supabase.table('sessions').delete().eq('id', session_id).execute()
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(debug=True, host='0.0.0.0', port=port)
