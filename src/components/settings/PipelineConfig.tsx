"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"

const DEFAULT = [
  "Lead",
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
]

export default function PipelineConfig() {
  const [stages, setStages] = useState<string[]>(DEFAULT)
  const [newStage, setNewStage] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pipeline_stages')
      if (stored) setStages(JSON.parse(stored))
    } catch (e) { console.error(e) }
  }, [])

  const updateStage = (index: number, value: string) => {
    const next = [...stages]
    next[index] = value
    setStages(next)
  }

  const removeStage = (index: number) => {
    setStages(stages.filter((_, i) => i !== index))
  }

  const addStage = () => {
    if (!newStage.trim()) return
    setStages([...stages, newStage.trim()])
    setNewStage('')
  }

  const save = () => {
    try {
      localStorage.setItem('pipeline_stages', JSON.stringify(stages))
      toast.success('Pipeline stages saved')
    } catch (e) { console.error(e); toast.error('Failed to save pipeline') }
  }

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Customize your opportunity pipeline stages and stage behavior.</p>
      <div className="grid gap-2">
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
            <input value={stage} onChange={(e) => updateStage(idx, e.target.value)} className="w-full mr-4 rounded border p-2" />
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => removeStage(idx)}>Remove</Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <input className="rounded border p-2 flex-1" placeholder="New stage name" value={newStage} onChange={(e) => setNewStage(e.target.value)} />
        <Button onClick={addStage}>Add</Button>
      </div>
      <div>
        <Button onClick={save}>Save Changes</Button>
      </div>
    </div>
  )
}
