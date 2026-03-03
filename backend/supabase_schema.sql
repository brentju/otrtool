-- Supabase Schema for OTR Tool
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    duration_minutes INTEGER,
    transcript_text TEXT NOT NULL,
    audio_file_path TEXT, -- For future voice recording feature
    metadata JSONB DEFAULT '{}'::jsonb
);

-- OTRs table
CREATE TABLE otrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    exchange_idx INTEGER NOT NULL,
    obsid INTEGER,
    teacher_text TEXT,
    student_text TEXT,
    is_otr BOOLEAN DEFAULT false,
    elicitation_type TEXT,
    response_type TEXT,
    cognitive_depth TEXT,
    mentioned_students JSONB DEFAULT '[]'::jsonb,
    gold_is_otr BOOLEAN,
    gold_elicitation_type TEXT,
    gold_response_type TEXT,
    gold_cognitive_depth TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(session_id, exchange_idx)
);

-- Student Reasoning table
CREATE TABLE student_reasoning (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    utterance_id INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    text TEXT NOT NULL,
    has_reasoning BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(session_id, utterance_id)
);

-- Indexes for performance
CREATE INDEX idx_otrs_session_id ON otrs(session_id);
CREATE INDEX idx_otrs_is_otr ON otrs(session_id, is_otr);
CREATE INDEX idx_otrs_mentioned_students_gin ON otrs USING GIN (mentioned_students);
CREATE INDEX idx_student_reasoning_session_id ON student_reasoning(session_id);
CREATE INDEX idx_student_reasoning_has_reasoning ON student_reasoning(session_id, has_reasoning);

-- Row Level Security (RLS) Policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE otrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reasoning ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (you can tighten this with auth later)
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on otrs" ON otrs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on student_reasoning" ON student_reasoning
    FOR ALL USING (true) WITH CHECK (true);

-- Function to calculate session metrics
CREATE OR REPLACE FUNCTION get_session_metrics(p_session_id UUID)
RETURNS JSON AS $$
DECLARE
    v_total_otrs INTEGER;
    v_duration INTEGER;
    v_otrs_per_minute NUMERIC;
    v_authentic_otrs INTEGER;
    v_student_reasoning_count INTEGER;
    v_elicitation_dist JSON;
    v_response_dist JSON;
    v_depth_dist JSON;
    v_student_mention_dist JSON;
    v_students_called_count INTEGER;
    v_total_student_mentions INTEGER;
BEGIN
    -- Get total OTRs
    SELECT COUNT(*) INTO v_total_otrs
    FROM otrs
    WHERE session_id = p_session_id AND is_otr = true;

    -- Get duration
    SELECT duration_minutes INTO v_duration
    FROM sessions
    WHERE id = p_session_id;

    -- Calculate OTRs per minute
    IF v_duration > 0 THEN
        v_otrs_per_minute := v_total_otrs::NUMERIC / v_duration;
    ELSE
        v_otrs_per_minute := 0;
    END IF;

    -- Get authentic OTRs
    SELECT COUNT(*) INTO v_authentic_otrs
    FROM otrs
    WHERE session_id = p_session_id 
      AND is_otr = true 
      AND cognitive_depth = 'authentic';

    -- Get student reasoning count
    SELECT COUNT(*) INTO v_student_reasoning_count
    FROM student_reasoning
    WHERE session_id = p_session_id AND has_reasoning = true;

    -- Get elicitation type distribution
    SELECT json_object_agg(COALESCE(elicitation_type, 'unknown'), cnt)
    INTO v_elicitation_dist
    FROM (
        SELECT elicitation_type, COUNT(*) as cnt
        FROM otrs
        WHERE session_id = p_session_id AND is_otr = true
        GROUP BY elicitation_type
    ) t;

    -- Get response type distribution
    SELECT json_object_agg(COALESCE(response_type, 'unknown'), cnt)
    INTO v_response_dist
    FROM (
        SELECT response_type, COUNT(*) as cnt
        FROM otrs
        WHERE session_id = p_session_id AND is_otr = true
        GROUP BY response_type
    ) t;

    -- Get cognitive depth distribution
    SELECT json_object_agg(COALESCE(cognitive_depth, 'unknown'), cnt)
    INTO v_depth_dist
    FROM (
        SELECT cognitive_depth, COUNT(*) as cnt
        FROM otrs
        WHERE session_id = p_session_id AND is_otr = true
        GROUP BY cognitive_depth
    ) t;

    -- Get student mention distribution from OTR teacher utterances
    SELECT
        json_object_agg(student_name, cnt),
        COUNT(*),
        SUM(cnt)
    INTO v_student_mention_dist, v_students_called_count, v_total_student_mentions
    FROM (
        SELECT mentioned_student AS student_name, COUNT(*) AS cnt
        FROM otrs o
        CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(o.mentioned_students, '[]'::jsonb)) AS mentioned_student
        WHERE o.session_id = p_session_id
          AND o.is_otr = true
        GROUP BY mentioned_student
    ) t;

    RETURN json_build_object(
        'total_otrs', COALESCE(v_total_otrs, 0),
        'otrs_per_minute', COALESCE(v_otrs_per_minute, 0),
        'authentic_otrs', COALESCE(v_authentic_otrs, 0),
        'student_reasoning_count', COALESCE(v_student_reasoning_count, 0),
        'elicitation_distribution', COALESCE(v_elicitation_dist, '{}'::json),
        'response_type_distribution', COALESCE(v_response_dist, '{}'::json),
        'cognitive_depth_distribution', COALESCE(v_depth_dist, '{}'::json),
        'student_mention_distribution', COALESCE(v_student_mention_dist, '{}'::json),
        'students_called_count', COALESCE(v_students_called_count, 0),
        'total_student_mentions', COALESCE(v_total_student_mentions, 0)
    );
END;
$$ LANGUAGE plpgsql;
