"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Loader2, FileText, Download, Upload, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

type ImportedNote = {
  content: string
  created_by?: string
  created_at?: string
}

export default function ImportNotesPage() {
  const router = useRouter()
  const [step, setStep] = useState<number>(1)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<number>(0)
  const [notes, setNotes] = useState<ImportedNote[]>([])
  const [preview, setPreview] = useState<string[]>([])
  const [totalCount, setTotalCount] = useState<number>(0)

  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // load existing imported notes count (optional)
    const stored = localStorage.getItem('imported_notes')
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ImportedNote[]
        setNotes(parsed)
      } catch (e) {}
    }
  }, [])

  const onBrowse = () => inputRef.current?.click()

  const handleFiles = async (f: File | null) => {
    setError(null)
    if (!f) return
    setFile(f)
    setProgress(0)
    setLoading(true)
    try {
      const name = f.name.toLowerCase()
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await f.text()
        const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
        setTotalCount(rows.length)
        setPreview(rows.slice(0,10))
      } else {
        setError('Unsupported file type')
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to read file')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0] ?? null
    handleFiles(f)
  }

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    handleFiles(f)
  }

  const downloadSample = async (type: 'csv' | 'xlsx') => {
    const csv = 'content\nSample note 1\nSample note 2\n'
    if (type === 'csv') {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sample_notes.csv'
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'sample_notes.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const goNext = () => setStep(s => Math.min(3, s+1))
  const goPrev = () => setStep(s => Math.max(1, s-1))

  const doImport = async () => {
    if (!file) return
    setLoading(true)
    setProgress(10)
    try {
      let rows: string[] = []
      const name = file.name.toLowerCase()
      if (name.endsWith('.csv') || name.endsWith('.txt')) {
        const text = await file.text()
        rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean)
      }

      setProgress(60)
      const newNotes: ImportedNote[] = rows.map(r => ({ content: r, created_by: 'Imported', created_at: new Date().toISOString() }))
      const existing = JSON.parse(localStorage.getItem('imported_notes') || '[]') as ImportedNote[]
      const merged = [...newNotes, ...existing]
      localStorage.setItem('imported_notes', JSON.stringify(merged))
      window.dispatchEvent(new Event('imported-notes-updated'))
      setNotes(merged)
      setProgress(100)
      setStep(3)
    } catch (e: any) {
      setError(e?.message || 'Import failed')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/contacts">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Import Notes</h1>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <span className="mr-1">📘</span> Help
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 flex items-start justify-center">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mt-2">You can import up to 5000 records. File types: .csv, .txt</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold">From File</div>
                  <div className="text-xs text-gray-500">Drag and drop your file here or browse</div>
                </div>
              </div>
              <div className="text-sm text-gray-500">Step {step} of 3</div>
            </div>

            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 transition"
            >
              <input ref={inputRef} type="file" accept=".csv,.txt" className="hidden" onChange={onSelect} />
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <div className="mt-3 text-sm text-gray-600">Drop file here</div>
              <div className="text-xs text-gray-500 mb-4">- or -</div>
              <Button onClick={onBrowse}>Browse</Button>
              <div className="mt-4 text-sm space-x-4">
                <button onClick={() => downloadSample('csv')} className="text-blue-600 hover:underline">CSV</button>
                <span className="text-gray-400">or</span>
                <button onClick={() => downloadSample('xlsx')} className="text-blue-600 hover:underline">XLSX</button>
              </div>
              <div className="mt-2 text-xs text-gray-500">Download sample file</div>
            </div>

            <div className="mt-6">
              {loading && <div className="flex items-center gap-2 text-sm text-gray-600"><Loader2 className="h-4 w-4 animate-spin" /> Processing...</div>}
              {error && <div className="text-sm text-red-600">{error}</div>}
              {file && (
                <div className="mt-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div>
                      <div className="text-sm font-medium">{file.name}</div>
                      <div className="text-xs text-gray-500">{(file.size/1024).toFixed(1)} KB</div>
                    </div>
                    {progress === 100 && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  {progress > 0 && progress < 100 && (
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                      <div style={{ width: `${progress}%` }} className="h-2 bg-blue-600 transition-all" />
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-2">Notes detected: {totalCount}</div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <div className="text-sm text-gray-500">{step === 1 ? 'Upload File' : step === 2 ? 'Preview Notes' : 'Import Complete'}</div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                {step > 1 && <Button variant="outline" onClick={goPrev}>Back</Button>}
                {step < 2 && <Button onClick={() => { if (!file) { setError('Please select a file first'); return } setStep(2) }}>Next</Button>}
                {step === 2 && <Button onClick={doImport}>Import</Button>}
              </div>
            </div>

            {/* Preview */}
            {step === 2 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-3">Preview (first 10 records)</h3>
                {preview.length === 0 ? (
                  <p className="text-sm text-gray-500">No preview available.</p>
                ) : (
                  <ul className="space-y-2">
                    {preview.map((p, i) => (
                      <li key={i} className="text-sm border rounded px-3 py-2 bg-slate-50">{p}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 text-xs text-gray-500">Total records: {totalCount}</div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 text-center border-t pt-6">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Import Complete!</h3>
                <p className="text-sm text-gray-600 mt-2">Successfully imported {totalCount} notes.</p>
                <Button onClick={() => router.push('/contacts')} className="mt-4">
                  Go to Contacts
                </Button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
