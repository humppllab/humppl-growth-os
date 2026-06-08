"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"
import { 
  getPipelineStages, 
  createPipelineStage, 
  updatePipelineStage, 
  deletePipelineStage 
} from "@/actions"
import { Loader2 } from "lucide-react"

interface Stage {
  id: number;
  name: string;
  probability: number;
  sort_order: number;
}

export default function PipelineConfig() {
  const [stages, setStages] = useState<Stage[]>([])
  const [newStage, setNewStage] = useState('')
  const [newProb, setNewProb] = useState('50')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStages()
  }, [])

  const loadStages = async () => {
    setLoading(true)
    try {
      const data = await getPipelineStages()
      setStages(data as any)
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to load pipeline stages.")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (stage: Stage, name: string, prob: number) => {
    try {
      await updatePipelineStage(stage.id, name, prob, stage.sort_order);
      toast.success("Stage updated.");
      loadStages();
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to update stage: " + e.message);
    }
  }

  const handleRemove = async (id: number) => {
    try {
      await deletePipelineStage(id)
      toast.success("Stage removed.")
      loadStages()
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to delete stage.")
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStage.trim()) return
    setSaving(true)
    try {
      const sortOrder = stages.length > 0 ? Math.max(...stages.map(s => s.sort_order)) + 10 : 10;
      await createPipelineStage(
        newStage.trim(),
        parseInt(newProb) || 0,
        sortOrder
      )
      toast.success("Pipeline stage created.")
      setNewStage('')
      setNewProb('50')
      loadStages()
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to create stage: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-sm text-gray-700">
      <div>
        <h4 className="font-bold text-gray-900 mb-1">Opportunity Pipeline Configuration</h4>
        <p className="text-gray-500">Configure Deal stages, win probability metrics, and pipeline sort order.</p>
      </div>

      <div className="grid gap-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 shadow-sm gap-4">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <input 
                value={stage.name} 
                onChange={(e) => handleUpdate(stage, e.target.value, stage.probability)} 
                className="w-full rounded-xl border px-3 py-1.5 font-semibold text-gray-900 bg-slate-50/50" 
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400 font-bold">Prob %</label>
                <input 
                  type="number"
                  value={stage.probability} 
                  onChange={(e) => handleUpdate(stage, stage.name, parseInt(e.target.value) || 0)} 
                  className="w-20 rounded-xl border px-3 py-1.5 font-semibold text-gray-950" 
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-700" onClick={() => handleRemove(stage.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="bg-slate-50 p-4 border rounded-2xl flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">New Stage Name</label>
          <input 
            className="rounded-xl border px-3 py-2 text-sm w-full bg-white" 
            placeholder="e.g. Solution Mapped" 
            value={newStage} 
            onChange={(e) => setNewStage(e.target.value)} 
            required
          />
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Win Prob %</label>
          <input 
            type="number"
            className="rounded-xl border px-3 py-2 text-sm w-full bg-white" 
            placeholder="50" 
            value={newProb} 
            onChange={(e) => setNewProb(e.target.value)} 
            required
          />
        </div>
        <Button type="submit" disabled={saving || !newStage.trim()}>
          {saving ? "Adding..." : "Add Stage"}
        </Button>
      </form>
    </div>
  )
}
