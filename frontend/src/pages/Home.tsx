import { BarChart3, Upload, FileText, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="max-w-xl w-full text-center">
        {/* Logo */}
        <div className="w-14 h-14 bg-terracotta-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>

        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          Welcome to OTR Tool
        </h1>
        <p className="text-stone-500 mb-10 text-[15px] leading-relaxed">
          Upload classroom transcripts to analyze teacher-student dialogue and
          discover opportunities to respond.
        </p>

        {/* Upload Card */}
        <div
          onClick={() => navigate('/upload')}
          className="bg-white rounded-xl border-2 border-dashed border-sand-300 p-10 cursor-pointer transition-all duration-200 hover:border-terracotta-400 hover:shadow-soft-lg group"
        >
          <div className="w-12 h-12 bg-sand-100 group-hover:bg-terracotta-50 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
            <Upload className="w-6 h-6 text-stone-400 group-hover:text-terracotta-500 transition-colors" />
          </div>
          <h3 className="text-[15px] font-medium text-stone-900 mb-1">
            Upload a Transcript
          </h3>
          <p className="text-stone-500 text-sm">
            Drag and drop or click to browse CSV or TXT files
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center mx-auto mb-2.5">
              <BarChart3 className="w-4 h-4 text-stone-500" />
            </div>
            <h4 className="font-medium text-stone-800 text-sm mb-0.5">OTR Analytics</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Track opportunities to respond by type and cognitive depth
            </p>
          </div>
          <div className="text-center">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center mx-auto mb-2.5">
              <FileText className="w-4 h-4 text-stone-500" />
            </div>
            <h4 className="font-medium text-stone-800 text-sm mb-0.5">Transcript View</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore annotated teacher-student exchanges
            </p>
          </div>
          <div className="text-center">
            <div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center mx-auto mb-2.5">
              <TrendingUp className="w-4 h-4 text-stone-500" />
            </div>
            <h4 className="font-medium text-stone-800 text-sm mb-0.5">Student Reasoning</h4>
            <p className="text-xs text-stone-500 leading-relaxed">
              Detect student reasoning patterns automatically
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
