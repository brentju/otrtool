import { useState } from 'react'
import { MessageSquare, User, GraduationCap } from 'lucide-react'
import type { OTR } from '../../types'

interface TranscriptViewerProps {
  otrs: OTR[]
}

type FilterType = 'all' | 'individual' | 'small_group' | 'choral' | 'peer_directed'

function TranscriptViewer({ otrs }: TranscriptViewerProps) {
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredOTRs = filter === 'all'
    ? otrs
    : otrs.filter(otr => otr.elicitation_type === filter)

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="card py-3 px-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-medium text-stone-500 mr-1">Filter:</span>
          {(['all', 'individual', 'small_group', 'choral', 'peer_directed'] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filter === type
                  ? 'bg-stone-800 text-white'
                  : 'bg-sand-100 text-stone-500 hover:bg-sand-200'
              }`}
            >
              {type === 'all' ? 'All OTRs' : type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* OTR List */}
      <div className="space-y-3">
        {filteredOTRs.length === 0 ? (
          <div className="card text-center py-12">
            <MessageSquare className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <p className="text-stone-500 text-sm">No OTRs found with current filter</p>
          </div>
        ) : (
          filteredOTRs.map((otr) => {
            const isAuthentic = otr.cognitive_depth === 'authentic'

            return (
              <div
                key={otr.id}
                className={`card border-l-[3px] ${isAuthentic ? 'border-l-terracotta-500' : 'border-l-sand-300'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-sand-100 text-stone-600">
                      {otr.elicitation_type?.replace('_', ' ') || 'Unknown'}
                    </span>
                    {otr.cognitive_depth && (
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-medium ${
                        isAuthentic
                          ? 'bg-terracotta-50 text-terracotta-700'
                          : 'bg-sand-100 text-stone-500'
                      }`}>
                        {otr.cognitive_depth}
                      </span>
                    )}
                    {otr.has_student_reasoning && (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-terracotta-50 text-terracotta-700">
                        Student Reasoning
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-stone-400">#{otr.exchange_idx}</span>
                </div>

                <div className="space-y-2.5">
                  {otr.student_text && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-sand-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                      </div>
                      <div className="bg-sand-50 rounded-lg px-3 py-2.5 flex-1">
                        <p className="text-sm text-stone-800 leading-relaxed">{otr.student_text}</p>
                      </div>
                    </div>
                  )}

                  {otr.teacher_text && (
                    <div className="flex gap-2.5">
                      <div className="w-7 h-7 bg-terracotta-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-terracotta-600" />
                      </div>
                      <div className="bg-white border border-sand-200 rounded-lg px-3 py-2.5 flex-1">
                        <p className="text-sm text-stone-800 leading-relaxed">{otr.teacher_text}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default TranscriptViewer
