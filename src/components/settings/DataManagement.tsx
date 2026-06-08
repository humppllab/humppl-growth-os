'use client'

import { Button } from "@/components/ui/Button"
import { toast } from "@/components/ui/Toast"

const EXPORT_KEYS = ['contacts_list', 'imported_notes', 'selected_contact']

function downloadBlob(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function DataManagement() {
  const exportAllData = () => {
    try {
      const exportData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        workspace: 'Humppl CRM',
        data: {},
      }

      EXPORT_KEYS.forEach((key) => {
        try {
          const stored = localStorage.getItem(key)
          exportData.data[key] = stored ? JSON.parse(stored) : null
        } catch (error) {
          exportData.data[key] = null
        }
      })

      const timelineKeys: Record<string, any> = {}
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (!key) continue
        if (key.startsWith('timeline_')) {
          try {
            timelineKeys[key] = JSON.parse(localStorage.getItem(key) || '[]')
          } catch (error) {
            timelineKeys[key] = []
          }
        }
      }

      if (Object.keys(timelineKeys).length) {
        exportData.data.timeline = timelineKeys
      }

      downloadBlob(`humppl-data-export-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.json`, JSON.stringify(exportData, null, 2))
      toast.success('Export started. Check your downloads folder.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to export data.')
    }
  }

  const archiveOldRecords = () => {
    try {
      const stored = localStorage.getItem('contacts_list') || '[]'
      const contacts = JSON.parse(stored) as Array<Record<string, any>>
      const now = Date.now()
      const threshold = 1000 * 60 * 60 * 24 * 90
      const toArchive = contacts.filter((contact) => {
        const date = contact?.created_at ? Date.parse(contact.created_at) : NaN
        return !Number.isNaN(date) && now - date >= threshold
      })
      const remaining = contacts.filter((contact) => {
        const date = contact?.created_at ? Date.parse(contact.created_at) : NaN
        return Number.isNaN(date) || now - date < threshold
      })

      if (toArchive.length === 0) {
        toast.info('No old records found to archive.')
        return
      }

      const archived = JSON.parse(localStorage.getItem('archived_contacts') || '[]') as Array<Record<string, any>>
      localStorage.setItem('contacts_list', JSON.stringify(remaining))
      localStorage.setItem('archived_contacts', JSON.stringify([...archived, ...toArchive]))
      toast.success(`Archived ${toArchive.length} old record(s).`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to archive records.')
    }
  }

  const deleteTemporaryData = () => {
    try {
      localStorage.removeItem('imported_notes')
      localStorage.removeItem('selected_contact')
      localStorage.removeItem('recent_searches')
      toast.success('Temporary workspace data deleted.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to delete temporary data.')
    }
  }

  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Control exports, cleanup, and data retention for your CRM workspace.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={exportAllData}>Export All Data</Button>
        <Button variant="outline" onClick={archiveOldRecords}>Archive Old Records</Button>
        <Button variant="destructive" onClick={deleteTemporaryData}>Delete Temporary Data</Button>
      </div>
      <p className="text-xs text-gray-500">These settings now perform real workspace actions in the browser.</p>
    </div>
  )
}
