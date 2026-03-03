export interface Session {
  id: string
  name: string
  created_at: string
  duration_minutes?: number
  transcript_text: string
}

export interface OTR {
  id: string
  session_id: string
  exchange_idx: number
  obsid: number
  teacher_text: string
  student_text: string
  is_otr: boolean
  elicitation_type?: string
  response_type?: string
  cognitive_depth?: string
  has_student_reasoning?: boolean
}

export interface SessionMetrics {
  total_otrs: number
  otrs_per_minute: number
  authentic_otrs: number
  student_reasoning_count: number
  elicitation_distribution: Record<string, number>
  response_type_distribution: Record<string, number>
  cognitive_depth_distribution: Record<string, number>
  student_mention_distribution: Record<string, number>
  students_called_count: number
  total_student_mentions: number
}

export interface StudentReasoning {
  id: string
  session_id: string
  utterance_id: number
  speaker: string
  text: string
  has_reasoning: boolean
}
