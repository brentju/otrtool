import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { OTR, SessionMetrics } from '../../types'

interface AuthenticQuestionsPanelProps {
  metrics: SessionMetrics
  otrs: OTR[]
}

const COLORS = {
  authentic: '#c4704a',
  test: '#cfc8bd',
}

function AuthenticQuestionsPanel({ metrics, otrs }: AuthenticQuestionsPanelProps) {
  const authenticCount = metrics.cognitive_depth_distribution?.authentic ?? 0
  const testCount = metrics.cognitive_depth_distribution?.test ?? 0
  const total = authenticCount + testCount
  const authenticPct = total > 0 ? (authenticCount / total) * 100 : 0
  const testPct = total > 0 ? (testCount / total) * 100 : 0

  const ratioData = [
    { name: 'Authentic', value: authenticCount },
    { name: 'Test', value: testCount },
  ]

  const otrOnly = (otrs ?? []).filter(otr => otr.is_otr)
  let runningAuthentic = 0
  const trendData = otrOnly.map((otr, index) => {
    const isAuthentic = otr.cognitive_depth === 'authentic'
    if (isAuthentic) {
      runningAuthentic += 1
    }
    return {
      otrOrder: index + 1,
      cumulativeAuthenticRate: Number(((runningAuthentic / (index + 1)) * 100).toFixed(1)),
      isAuthentic,
      teacherText: otr.teacher_text,
      depth: isAuthentic ? 'Authentic' : 'Test',
    }
  })

  const tooltipStyle = {
    backgroundColor: 'white',
    border: '1px solid #e0dbd3',
    borderRadius: '8px',
    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.08)',
    fontSize: '13px',
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">Authentic vs Test Ratio</h3>
          {total > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ratioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={82}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    fontSize={12}
                  >
                    <Cell fill={COLORS.authentic} />
                    <Cell fill={COLORS.test} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 space-y-1 text-sm text-stone-600">
                <p>Authentic: {authenticCount} ({authenticPct.toFixed(0)}%)</p>
                <p>Test: {testCount} ({testPct.toFixed(0)}%)</p>
              </div>
            </>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-stone-500">
              No authentic/test OTRs yet.
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-stone-900 mb-1">Authentic Questions Timeline</h3>
          <p className="text-xs text-stone-500 mb-4">Trend shows cumulative authentic-question rate across OTR order.</p>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 10, right: 16, bottom: 10, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0dbd3" />
                <XAxis
                  dataKey="otrOrder"
                  stroke="#9b9286"
                  fontSize={12}
                  label={{ value: 'OTR Order', position: 'insideBottom', offset: -6, fill: '#9b9286' }}
                />
                <YAxis
                  stroke="#9b9286"
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  width={54}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(_value, _name, props) => {
                    const payload = props?.payload as { depth?: string; cumulativeAuthenticRate?: string } | undefined
                    return [`${payload?.cumulativeAuthenticRate ?? '0'}%`, `Rate (${payload?.depth ?? 'Unknown'})`]
                  }}
                  labelFormatter={(value) => `OTR ${value}`}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeAuthenticRate"
                  stroke={COLORS.authentic}
                  strokeWidth={2.5}
                  dot={({ cx, cy, payload }) => (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill={payload?.isAuthentic ? COLORS.authentic : COLORS.test}
                      stroke={payload?.isAuthentic ? COLORS.authentic : '#b9b2a8'}
                      strokeWidth={1}
                    />
                  )}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-stone-500">
              No OTRs available for timeline yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthenticQuestionsPanel
