import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, BarChart3, MessageSquare, Trash2, Menu, X } from 'lucide-react'
import { sessionsApi } from '../../lib/api'
import type { Session } from '../../types'

interface SidebarLayoutProps {
  children: React.ReactNode
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [sessions, setSessions] = useState<Session[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const response = await sessionsApi.getAll()
      setSessions(response.data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNewUpload = () => {
    navigate('/upload')
  }

  const handleSelectSession = (sessionId: string) => {
    navigate(`/sessions/${sessionId}`)
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this session?')) return

    try {
      await sessionsApi.delete(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      if (location.pathname === `/sessions/${sessionId}`) {
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex h-screen bg-sand-50 overflow-hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-stone-800 text-stone-300 rounded-lg shadow-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 bg-stone-800 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-stone-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-terracotta-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-stone-100 text-sm">OTR Tool</h1>
                <p className="text-xs text-stone-400">Educator Dashboard</p>
              </div>
            </div>
          </div>

          {/* New Upload Button */}
          <div className="p-3">
            <button
              onClick={handleNewUpload}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-stone-600 text-stone-300 hover:bg-stone-700 hover:text-stone-100 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Upload
            </button>
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-2 pb-4">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider px-3 mb-2">
              Sessions
            </div>
            {loading ? (
              <div className="px-3 py-8 text-center text-stone-500 text-sm">
                Loading...
              </div>
            ) : sessions.length === 0 ? (
              <div className="px-3 py-8 text-center text-stone-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No sessions yet</p>
                <p className="text-xs mt-1 text-stone-600">Upload a transcript to get started</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      location.pathname === `/sessions/${session.id}`
                        ? 'bg-stone-700 text-stone-100'
                        : 'text-stone-300 hover:bg-stone-700/50 hover:text-stone-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">
                        {session.name}
                      </div>
                      <div className="text-xs text-stone-500">
                        {formatDate(session.created_at)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-stone-600 rounded-md transition-all"
                      aria-label="Delete session"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-stone-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
