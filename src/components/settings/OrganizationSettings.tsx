"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"

type OrgSettings = {
  companyName: string
  billingPlan: string
}

const STORAGE_KEY = 'org_settings'

export default function OrganizationSettings() {
  const [form, setForm] = useState<OrgSettings>({ companyName: '', billingPlan: 'Standard' })

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setForm(JSON.parse(stored))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
      toast.success('Organization settings saved')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save settings')
    }
  }

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Manage account-wide settings for your company, billing, and workspace preferences.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Company</p>
          <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="mt-2 w-full rounded border p-2" placeholder="Company Name" />
          <p className="text-sm text-gray-500 mt-2">CRM subscription and address are configured here.</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Billing</p>
          <select value={form.billingPlan} onChange={(e) => setForm({ ...form, billingPlan: e.target.value })} className="mt-2 w-full rounded border p-2">
            <option>Free</option>
            <option>Standard</option>
            <option>Pro</option>
            <option>Enterprise</option>
          </select>
          <p className="text-sm text-gray-500 mt-2">Updates to invoices and payment method settings.</p>
        </div>
      </div>
      <div className="pt-2">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  )
}
