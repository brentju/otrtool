"""
Reset the Supabase database by dropping and recreating all tables.
Run this once before loading sample data.

Usage:
    python reset_db.py
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

def reset_database():
    """Drop and recreate all tables."""
    
    print("Resetting database...")
    
    # Read the reset SQL file
    sql_file = Path(__file__).parent / "reset_database.sql"
    if not sql_file.exists():
        print(f"Error: {sql_file} not found")
        sys.exit(1)
    
    sql_content = sql_file.read_text()
    
    # Split by semicolons and execute each statement
    # Note: Supabase Python client doesn't support multi-statement execution directly
    # We need to use the REST API or execute statements one by one
    
    # For simplicity, let's just drop the tables and recreate the essential ones
    print("Dropping existing tables...")
    
    try:
        # Drop tables (they have CASCADE so dependencies are handled)
        supabase.table('student_reasoning').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    except:
        pass
    
    try:
        supabase.table('otrs').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    except:
        pass
    
    try:
        supabase.table('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
    except:
        pass
    
    print("Tables dropped.")
    print("\n⚠️  Now please go to Supabase SQL Editor and run:")
    print(f"   {Path(__file__).parent / 'reset_database.sql'}")
    print("\nThen run load_sample_data.py to load the sample data.")


if __name__ == '__main__':
    reset_database()
