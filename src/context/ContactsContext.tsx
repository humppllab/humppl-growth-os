"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { getContacts } from "@/actions"

type Contact = any

type ContactsContextValue = {
  contacts: Contact[]
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>
  loading: boolean
  refresh: () => Promise<void>
}

const ContactsContext = createContext<ContactsContextValue | undefined>(undefined)

export const ContactsProvider = ({ children }: { children: React.ReactNode }) => {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getContacts()
      if (Array.isArray(data)) {
        setContacts(data)
        try { localStorage.setItem('contacts_list', JSON.stringify(data)) } catch (e) {}
      }
    } catch (e) {
      console.error('ContactsProvider: failed to fetch contacts', e)
      // fallback to localStorage
      try {
        const stored = JSON.parse(localStorage.getItem('contacts_list') || '[]')
        if (Array.isArray(stored)) setContacts(stored)
      } catch (err) {}
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    try { localStorage.setItem('contacts_list', JSON.stringify(contacts)) } catch (e) {}
  }, [contacts])

  return (
    <ContactsContext.Provider value={{ contacts, setContacts, loading, refresh: load }}>
      {children}
    </ContactsContext.Provider>
  )
}

export const useContacts = () => {
  const ctx = useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts must be used within ContactsProvider')
  return ctx
}
