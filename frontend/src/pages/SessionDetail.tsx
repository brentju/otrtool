import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart3, Brain, RefreshCw, Trash2, ArrowLeft } from 'lucide-react'
import { sessionsApi, annotationApi } from '../lib/api'
import type { Session, SessionMetrics, OTR } from '../types'
import MetricsGrid from '../components/Dashboard/MetricsGrid'
import OTRCharts from '../components/Dashboard/OTRCharts'
import TranscriptViewer from '../components/Transcript/TranscriptViewer'

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [metrics, setMetrics] = useState<SessionMetrics | null>(null)
  const [otrs, setOtrs] = useState<OTR[]>([])
  const [loading, setLoading] = useState(true)
  const [annotating, setAnnotating] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transcript'>('dashboard')

  useEffect(() => {
    if (!id) return

    const loadData = async () => {
      try {
        const [sessionRes, metricsRes, otrsRes] = await Promise.all([
          sessionsApi.getById(id),
          sessionsApi.getMetrics(id),
          sessionsApi.getOTRs(id),
        ])
        setSession(sessionRes.data)
        setMetrics(metricsRes.data)
        setOtrs(otrsRes.data)
      } catch (error) {
        console.error('Failed to load session data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleAnnotate = async () => {
    if (!id) return
    setAnnotating(true)
    try {
      await annotationApi.triggerStudentReasoning(id)
      const metricsRes = await sessionsApi.getMetrics(id)
      setMetrics(metricsRes.data)
    } catch (error) {
      console.error('Failed to annotate:', error)
    } finally {
      setAnnotating(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      await sessionsApi.delete(id)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 text-terracotta-500 animate-spin mx-auto mb-3" />
          <p className="text-stone-500 text-sm">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session || !metrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-500 mb-4 text-sm">Session not found</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-sand-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="lg:hidden p-1.5 hover:bg-sand-100 rounded-md transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-stone-500" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-stone-900">{session.name}</h1>
              <p className="text-xs text-stone-500">
                {new Date(session.created_at).toLocaleDateString()}
                {session.duration_minutes && ` \u00b7 ~${session.duration_minutes} min`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAnnotate}
              disabled={annotating}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${annotating ? 'animate-spin' : ''}`} />
              {annotating ? 'Analyzing...' : 'Analyze Reasoning'}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-coral-50 rounded-lg transition-colors text-stone-500 hover:text-coral-600"
              aria-label="Delete session"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mt-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`pb-2 px-0.5 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'border-terracotta-500 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </div>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-2 px-0.5 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'transcript'
                ? 'border-terracotta-500 text-stone-900'
                : 'border-transparent text-stone-500 hover:text-stone-700'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" />
              Transcript
            </div>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-sand-50 p-6">
        {activeTab === 'dashboard' ? (
          <div className="max-w-6xl mx-auto space-y-5">
            <MetricsGrid metrics={metrics} duration={session.duration_minutes} />
            <OTRCharts metrics={metrics} />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <TranscriptViewer otrs={otrs} />
          </div>
        )}
      </div>
    </div>
  )
}
