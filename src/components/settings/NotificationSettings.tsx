"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"

const DEFAULT = [
  { label: "Email alerts", enabled: true },
  { label: "SMS reminders", enabled: false },
  { label: "Weekly summary", enabled: true },
  { label: "Pipeline notifications", enabled: true },
]

export default function NotificationSettings() {
  const [items, setItems] = useState(DEFAULT)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notification_prefs')
      if (stored) setItems(JSON.parse(stored))
    } catch (e) { console.error(e) }
  }, [])

  const toggle = (index: number) => {
    const next = [...items]
    next[index].enabled = !next[index].enabled
    setItems(next)
  }

  const save = () => {
    try {
      localStorage.setItem('notification_prefs', JSON.stringify(items))
      toast.success('Notification preferences saved')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save preferences')
    }
  }

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Configure how your team receives activity and pipeline notifications.</p>
      <div className="grid gap-2">
        {items.map((item, idx) => (
          <label key={item.label} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
            <span>{item.label}</span>
            <div className="flex items-center space-x-3">
              <button onClick={() => toggle(idx)} className={`px-3 py-1 rounded-full text-xs font-semibold ${item.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {item.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </label>
        ))}
      </div>
      <div>
        <Button onClick={save}>Save Changes</Button>
      </div>
    </div>
  )
}
