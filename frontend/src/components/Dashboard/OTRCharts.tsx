import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { SessionMetrics } from '../../types'

interface OTRChartsProps {
  metrics: SessionMetrics
}

const COLORS = {
  primary: '#c4704a',
  secondary: '#908b82',
  tertiary: '#b5ada1',
  quaternary: '#cfc8bd',
  muted: '#e0dbd3',
}

const PIE_COLORS = ['#c4704a', '#908b82', '#b5ada1', '#cfc8bd']

function OTRCharts({ metrics }: OTRChartsProps) {
  const elicitationData = Object.entries(metrics.elicitation_distribution).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
  }))

  const responseData = Object.entries(metrics.response_type_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const depthData = Object.entries(metrics.cognitive_depth_distribution).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }))

  const tooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0dbd3',
    borderRadius: '8px',
    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
    fontSize: '13px',
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      {/* Elicitation Type Distribution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-stone-900 mb-4">Elicitation Type</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={elicitationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              fontSize={12}
            >
              {elicitationData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Cognitive Depth Distribution */}
      <div className="card">
        <h3 className="text-sm font-semibold text-stone-900 mb-4">Cognitive Depth</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={depthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0dbd3" />
            <XAxis dataKey="name" stroke="#9b9286" fontSize={12} />
            <YAxis stroke="#9b9286" fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Response Type Distribution */}
      <div className="card lg:col-span-2">
        <h3 className="text-sm font-semibold text-stone-900 mb-4">Response Type</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={responseData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e0dbd3" />
            <XAxis type="number" stroke="#9b9286" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="#9b9286" width={100} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="value" fill={COLORS.secondary} radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default OTRCharts
