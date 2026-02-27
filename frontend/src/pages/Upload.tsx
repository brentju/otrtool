import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import { Upload as UploadIcon, FileText, X, Check, Loader2 } from 'lucide-react'
import { uploadApi } from '../lib/api'

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [sessionName, setSessionName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      if (!sessionName) {
        setSessionName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''))
      }
      setError(null)
    }
  }, [sessionName])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file || !sessionName) return

    setIsUploading(true)
    setError(null)

    try {
      const response = await uploadApi.uploadTranscript(file, sessionName)
      navigate(`/sessions/${response.data.id}`)
    } catch (err) {
      setError('Failed to upload transcript. Please try again.')
      console.error(err)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = () => {
    setFile(null)
    setSessionName('')
  }

  if (isUploading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="card w-full max-w-lg text-center py-12">
          <Loader2 className="w-10 h-10 mx-auto text-terracotta-500 animate-spin mb-4" />
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Uploading and analyzing...</h1>
          <p className="text-stone-500 text-sm">
            Hang tight while we process your transcript. This can take a moment.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Upload Transcript</h1>
          <p className="text-stone-500 text-sm">
            Upload a classroom dialogue transcript to analyze opportunities to respond.
          </p>
        </div>

        <div className="card">
          {/* Session Name Input */}
          <div className="mb-5">
            <label htmlFor="sessionName" className="block text-sm font-medium text-stone-700 mb-1.5">
              Session Name
            </label>
            <input
              type="text"
              id="sessionName"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="input-field"
              placeholder="e.g., Math Lesson - Period 3"
            />
          </div>

          {/* Dropzone */}
          {!file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-terracotta-400 bg-terracotta-50'
                  : 'border-sand-300 hover:border-terracotta-300 hover:bg-sand-50'
              }`}
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              {isDragActive ? (
                <p className="text-terracotta-600 font-medium text-sm">Drop the file here...</p>
              ) : (
                <>
                  <p className="text-stone-700 font-medium mb-1 text-sm">
                    Drag & drop your transcript file here
                  </p>
                  <p className="text-stone-500 text-xs">
                    or click to browse (.txt, .csv)
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="border border-sand-200 bg-sand-50 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sand-200 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-stone-500" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900 text-sm">{file.name}</p>
                    <p className="text-xs text-stone-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1.5 hover:bg-sand-200 rounded-md transition-colors"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-terracotta-600 text-xs font-medium">
                <Check className="w-3.5 h-3.5" />
                File ready to upload
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-coral-50 border border-coral-200 rounded-lg text-coral-700 text-sm">
              {error}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || !sessionName || isUploading}
            className="btn-primary w-full mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload & Analyze'}
          </button>

          {/* Info Note */}
          <p className="text-center text-xs text-stone-500 mt-3">
            Your transcript will be processed to identify teacher-student exchanges and
            opportunities to respond.
          </p>
        </div>
      </div>
    </div>
  )
}
