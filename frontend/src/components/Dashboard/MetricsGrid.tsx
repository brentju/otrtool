import { TrendingUp, MessageSquare, Brain, Clock } from 'lucide-react'
import type { SessionMetrics } from '../../types'

interface MetricsGridProps {
  metrics: SessionMetrics
  duration?: number
}

function MetricsGrid({ metrics, duration }: MetricsGridProps) {
  const metricCards = [
    {
      title: 'Total OTRs',
      value: metrics.total_otrs,
      icon: MessageSquare,
      description: 'Opportunities to respond',
    },
    {
      title: 'OTRs per Minute',
      value: metrics.otrs_per_minute.toFixed(2),
      icon: Clock,
      description: duration ? `Over ${duration} min session` : 'Rate of OTRs',
    },
    {
      title: 'Authentic OTRs',
      value: metrics.authentic_otrs,
      icon: Brain,
      description: 'Eliciting deeper reasoning',
    },
    {
      title: 'Student Reasoning',
      value: metrics.student_reasoning_count,
      icon: TrendingUp,
      description: 'Instances detected',
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric) => {
        const Icon = metric.icon

        return (
          <div key={metric.title} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className="bg-sand-100 p-2.5 rounded-lg">
                <Icon className="w-5 h-5 text-stone-500" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-semibold text-stone-900 mb-0.5">{metric.value}</p>
              <p className="text-sm font-medium text-stone-700">{metric.title}</p>
              <p className="text-xs text-stone-500 mt-0.5">{metric.description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default MetricsGrid
