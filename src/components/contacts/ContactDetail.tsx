"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useContacts } from "@/context/ContactsContext"
import { Button } from "@/components/ui/Button"
import { Pencil, Trash2, ArrowLeft, Clock } from "lucide-react"

type Contact = {
  id: number
  first_name?: string
  last_name?: string
  email?: string
  job_title?: string
  organizations?: { id?: number; name?: string } | null
  phone?: string
  mobile?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zip?: string
  notes?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  modified_by?: string
  [key: string]: any
}

type TimelineEvent = {
  id?: string
  activity: string
  user?: string
  at: string
  icon?: string
}

export default function ContactDetail({ id }: { id: string }) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [editing, setEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview'|'timeline'>('overview')
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const { contacts, setContacts, loading } = useContacts()

  useEffect(() => {
    console.log('Requested Contact ID', id)
    console.log('Available Contacts', contacts)
  }, [id, contacts])

  useEffect(() => {
    if (loading) {
      return
    }

    try {
      const found = contacts.find((c: any) => String(c.id) === String(id))
      if (found) {
        setContact(found)
      } else {
        const list = JSON.parse(localStorage.getItem('contacts_list') || '[]') as Contact[]
        const fallback = list.find((c) => String(c.id) === String(id))
        if (fallback) {
          setContact(fallback)
        } else {
          console.warn('ContactDetail: contact not found for id', id, 'available ids', (contacts || []).map((c: any) => c.id))
        }
      }
    } catch (e) {
      console.error(e)
    }
  }, [id, contacts, loading])

  useEffect(() => {
    if (!contact) {
      setTimeline([])
      return
    }

    try {
      const events = JSON.parse(localStorage.getItem(`timeline_${id}`) || '[]') as TimelineEvent[]
      if (events && events.length > 0) {
        setTimeline(events)
      } else {
        const createdAt = contact.created_at || new Date().toISOString()
        setTimeline([{ activity: 'Contact Created', user: contact.created_by || 'System', at: createdAt, icon: 'check' }])
      }
    } catch (e) {
      console.error(e)
      setTimeline([])
    }
  }, [id, contact])

  useEffect(() => {
    const handler = (e: any) => {
      if (!e?.detail) return
      const updated = e.detail as Contact
      if (String(updated.id) === String(id)) {
        setContact(updated)
        const ev: TimelineEvent = { activity: 'Contact Updated', user: updated.modified_by || 'You', at: new Date().toISOString(), icon: 'edit' }
        pushTimeline(ev)
      }
    }
    const delHandler = (e: any) => {
      if (!e?.detail) return
      if (e.detail.id && String(e.detail.id) === String(id)) {
        router.push('/contacts')
      }
    }
    window.addEventListener('contact-updated', handler)
    window.addEventListener('contact-deleted', delHandler)
    return () => {
      window.removeEventListener('contact-updated', handler)
      window.removeEventListener('contact-deleted', delHandler)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const pushTimeline = (ev: TimelineEvent) => {
    try {
      const cur = JSON.parse(localStorage.getItem(`timeline_${id}`) || '[]') as TimelineEvent[]
      const updated = [{ ...ev, id: String(Date.now()) }, ...(cur || [])]
      localStorage.setItem(`timeline_${id}`, JSON.stringify(updated))
      setTimeline(updated)
    } catch (e) {}
  }

  const startEdit = () => setEditing(true)

  const handleSave = (updatedFields: Partial<Contact>) => {
    if (!contact) return
    const updated = { ...contact, ...updatedFields, updated_at: new Date().toISOString(), modified_by: updatedFields.modified_by || 'You' }
    setContact(updated)
    try {
      // update contacts_list and selected_contact
      const list = JSON.parse(localStorage.getItem('contacts_list') || '[]') as Contact[]
      const newList = list.map(c => (String(c.id) === String(id) ? updated : c))
      localStorage.setItem('contacts_list', JSON.stringify(newList))
      localStorage.setItem('selected_contact', JSON.stringify(updated))
      try { setContacts(newList) } catch (e) {}
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('contact-updated', { detail: updated }))
    pushTimeline({ activity: 'Contact Updated', user: updated.modified_by, at: new Date().toISOString(), icon: 'edit' })
    setEditing(false)
  }

  const handleDelete = () => {
    if (!confirm('Delete this contact? This cannot be undone.')) return
    try {
      const list = JSON.parse(localStorage.getItem('contacts_list') || '[]') as Contact[]
      const filtered = list.filter((c) => String(c.id) !== String(id))
      localStorage.setItem('contacts_list', JSON.stringify(filtered))
      try { setContacts(filtered) } catch (e) {}
    } catch (e) {
      console.error(e)
    }
    window.dispatchEvent(new CustomEvent('contact-deleted', { detail: { id } }))
    router.push('/contacts')
  }

  if (loading && !contact) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Loading contact...</p>
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Contact not found for id: {id}.</p>
        <p className="text-xs text-gray-400">Check browser console for available contact ids.</p>
        <div className="mt-4">
          <Button onClick={() => router.push('/contacts')}>Back to Contacts</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="h-9 w-9"><ArrowLeft /></Button>
            <div>
              <h1 className="text-2xl font-bold">{contact.first_name} {contact.last_name}</h1>
              <div className="text-sm text-gray-500">{contact.organizations?.name || ''}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={startEdit}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex gap-6 border-b border-slate-200">
          <button onClick={() => setActiveTab('overview')} className={`py-3 text-sm ${activeTab==='overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Overview</button>
          <button onClick={() => setActiveTab('timeline')} className={`py-3 text-sm ${activeTab==='timeline' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}>Timeline</button>
        </div>

        {activeTab === 'overview' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border p-4 bg-white">
                <h3 className="font-semibold text-sm text-gray-700">Contact Details</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div><strong>Contact Owner:</strong><div className="text-sm text-gray-500">{contact.contactOwner || contact.created_by || '--'}</div></div>
                  <div><strong>Lead Source:</strong><div className="text-sm text-gray-500">{contact.lead_source || '--'}</div></div>
                  <div><strong>Title:</strong><div className="text-sm text-gray-500">{contact.job_title || contact.title || '--'}</div></div>
                  <div><strong>Department:</strong><div className="text-sm text-gray-500">{contact.department || '--'}</div></div>
                  <div><strong>Email:</strong><div className="text-sm text-gray-500">{contact.email || '--'}</div></div>
                  <div><strong>Phone:</strong><div className="text-sm text-gray-500">{contact.phone || '--'}</div></div>
                  <div><strong>Mobile:</strong><div className="text-sm text-gray-500">{contact.mobile || '--'}</div></div>
                  <div><strong>Website:</strong><div className="text-sm text-gray-500">{contact.website || '--'}</div></div>
                  <div className="col-span-2"><strong>Address:</strong><div className="text-sm text-gray-500">{contact.address || '--'}</div></div>
                  <div><strong>City:</strong><div className="text-sm text-gray-500">{contact.city || '--'}</div></div>
                  <div><strong>State:</strong><div className="text-sm text-gray-500">{contact.state || '--'}</div></div>
                  <div><strong>Country:</strong><div className="text-sm text-gray-500">{contact.country || '--'}</div></div>
                  <div><strong>Zip Code:</strong><div className="text-sm text-gray-500">{contact.zip || '--'}</div></div>
                </div>
              </div>

              <div className="rounded-2xl border p-4 bg-white">
                <h3 className="font-semibold text-sm text-gray-700">Notes</h3>
                <div className="mt-2 text-sm text-gray-600">{contact.notes || '--'}</div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border p-4 bg-white text-sm text-gray-700">
                <div><strong>Organization</strong></div>
                <div className="mt-2 text-gray-600">{contact.organizations?.name || '--'}</div>
              </div>
              <div className="rounded-2xl border p-4 bg-white text-sm text-gray-700">
                <div><strong>Created By</strong></div>
                <div className="mt-2 text-gray-600">{contact.created_by || '--'}</div>
                <div className="mt-2 text-xs text-gray-400">Created: {contact.created_at ? new Date(contact.created_at).toLocaleString() : '--'}</div>
                <div className="mt-1 text-xs text-gray-400">Updated: {contact.updated_at ? new Date(contact.updated_at).toLocaleString() : '--'}</div>
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mt-6 space-y-3">
            {timeline.length === 0 ? <div className="text-sm text-gray-500">No activity yet.</div> : (
              <ul className="space-y-2">
                {timeline.map((t) => (
                  <li key={t.id || t.at} className="flex items-start gap-3 bg-white border rounded p-3">
                    <div className="pt-1"><Clock className="h-5 w-5 text-gray-500" /></div>
                    <div>
                      <div className="text-sm font-semibold">{t.activity}</div>
                      <div className="text-xs text-gray-500">{t.user} • {new Date(t.at).toLocaleString()}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
