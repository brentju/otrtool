import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
}

export const sessionsApi = {
  getAll: () => api.get<Session[]>('/sessions'),
  getById: (id: string) => api.get<Session>(`/sessions/${id}`),
  getMetrics: (id: string) => api.get<SessionMetrics>(`/sessions/${id}/metrics`),
  getOTRs: (id: string) => api.get<OTR[]>(`/sessions/${id}/otrs`),
  create: (data: { name: string; transcript_text: string }) => api.post<Session>('/sessions', data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
}

export const uploadApi = {
  uploadTranscript: (file: File, name: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    return api.post<Session>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const annotationApi = {
  triggerStudentReasoning: (sessionId: string) => api.post(`/sessions/${sessionId}/annotate`),
}
