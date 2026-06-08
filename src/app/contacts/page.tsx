'use client'

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/Button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table"
import { Plus, Search, SlidersHorizontal, Mail, Pencil, Trash2, Loader2, Upload, Download, CheckCircle, AlertCircle, X } from "lucide-react"
import { getContacts, createContactWithOrgOnly, updateContact, deleteContact } from "@/actions"
import { useRouter } from 'next/navigation'
import { useContacts } from '@/context/ContactsContext'
import { getEmailTemplate, openGmailCompose } from "@/lib/templates"
import EmailComposerButton from "@/components/ui/EmailComposerButton"

interface Contact {
  id: number
  created_at: string
  first_name: string
  last_name: string
  email: string
  job_title: string
  organization_id: number
  organizations?: {
    id?: number
    name: string
  } | null
}

const isValidEmail = (value: string) => /^[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(value)

export default function ContactsPage() {
  const router = useRouter()
  const { contacts, setContacts, loading } = useContacts()
  // local loading/error state kept for UI messages
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState("")
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterJobTitle, setFilterJobTitle] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "newest" | "designation">("newest")
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([])

  const [contactOwner, setContactOwner] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organizationName, setOrganizationName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otherPhone, setOtherPhone] = useState("")
  const [mobile, setMobile] = useState("")
  const [assistant, setAssistant] = useState("")
  const [leadSource, setLeadSource] = useState("")
  const [title, setTitle] = useState("")
  const [department, setDepartment] = useState("")
  const [homePhone, setHomePhone] = useState("")
  const [fax, setFax] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [assistantPhone, setAssistantPhone] = useState("")
  const [emailOptOut, setEmailOptOut] = useState(false)
  const [website, setWebsite] = useState("")
  const [organizationIndustry, setOrganizationIndustry] = useState("")
  const [organizationWebsite, setOrganizationWebsite] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [stateValue, setStateValue] = useState("")
  const [country, setCountry] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [linkedInProfile, setLinkedInProfile] = useState("")
  const [skypeId, setSkypeId] = useState("")
  const [notes, setNotes] = useState("")
  const [createdBy, setCreatedBy] = useState("")
  const [modifiedBy, setModifiedBy] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const importNotesRef = useRef<HTMLInputElement | null>(null)
  
  // Import modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importSuccess, setImportSuccess] = useState(false)
  const [selectedCRM, setSelectedCRM] = useState<"zoho" | "salesforce" | "hubspot" | "pipedrive" | "freshsales" | null>(null)
  const [importSummary, setImportSummary] = useState({ total: 0, successful: 0, failed: 0 })
  const [validationErrorsList, setValidationErrorsList] = useState<string[]>([])
  const dragRef = useRef<HTMLDivElement | null>(null)

  // contacts are loaded by ContactsProvider; preserve previous error handling

  const closeDrawer = () => {
    setIsDrawerOpen(false)
    setEditingContact(null)
    setValidationErrors({})
  }

  const resetForm = () => {
    setContactOwner("")
    setFirstName("")
    setLastName("")
    setOrganizationName("")
    setEmail("")
    setPhone("")
    setOtherPhone("")
    setMobile("")
    setAssistant("")
    setLeadSource("")
    setTitle("")
    setDepartment("")
    setHomePhone("")
    setFax("")
    setDateOfBirth("")
    setAssistantPhone("")
    setEmailOptOut(false)
    setWebsite("")
    setOrganizationIndustry("")
    setOrganizationWebsite("")
    setAddress("")
    setCity("")
    setStateValue("")
    setCountry("")
    setZipCode("")
    setLinkedInProfile("")
    setSkypeId("")
    setNotes("")
    setCreatedBy("")
    setModifiedBy("")
    setValidationErrors({})
  }

  const openNewContactDrawer = () => {
    resetForm()
    setEditingContact(null)
    setIsDrawerOpen(true)
  }

  const openEditContactDrawer = (contact: Contact) => {
    setEditingContact(contact)
    setContactOwner("")
    setFirstName(contact.first_name)
    setLastName(contact.last_name)
    setEmail(contact.email)
    setOrganizationName(contact.organizations?.name || "")
    setTitle(contact.job_title || "")
    setPhone("")
    setOtherPhone("")
    setMobile("")
    setAssistant("")
    setLeadSource("")
    setDepartment("")
    setHomePhone("")
    setFax("")
    setDateOfBirth("")
    setAssistantPhone("")
    setEmailOptOut(false)
    setWebsite("")
    setOrganizationIndustry("")
    setOrganizationWebsite("")
    setAddress("")
    setCity("")
    setStateValue("")
    setCountry("")
    setZipCode("")
    setLinkedInProfile("")
    setSkypeId("")
    setNotes("")
    setCreatedBy("")
    setModifiedBy("")
    setIsDrawerOpen(true)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!firstName.trim()) errors.firstName = "First name is required"
    if (!lastName.trim()) errors.lastName = "Last name is required"
    if (!organizationName.trim()) errors.organizationName = "Organization name is required"
    if (!email.trim()) errors.email = "Email is required"
    else if (!isValidEmail(email)) errors.email = "Enter a valid email address"
    if (!title.trim()) errors.title = "Title is required"

    return errors
  }

  const buildNoteContent = () => {
    return [
      contactOwner && `Contact owner: ${contactOwner}`,
      leadSource && `Lead source: ${leadSource}`,
      department && `Department: ${department}`,
      address && `Address: ${address}`,
      city && `City: ${city}`,
      stateValue && `State: ${stateValue}`,
      country && `Country: ${country}`,
      zipCode && `Zip code: ${zipCode}`,
      linkedInProfile && `LinkedIn: ${linkedInProfile}`,
      skypeId && `Skype: ${skypeId}`,
      website && `Website: ${website}`,
      notes && `Notes: ${notes}`,
    ]
      .filter(Boolean)
      .join("\n")
  }

  const parseJobTitle = (jobTitle: string) => {
    if (!jobTitle) return { role: "--", phone: "--", mobile: "--" }
    const parts = jobTitle.split(" | ")
    const role = parts[0] || "--"
    let phoneValue = "--"
    let mobileValue = "--"

    parts.forEach((part) => {
      if (part.startsWith("Ph: ")) phoneValue = part.substring(4)
      if (part.startsWith("Mob: ")) mobileValue = part.substring(5)
    })

    return { role, phone: phoneValue, mobile: mobileValue }
  }

  const handleSave = async (closeAfter = false) => {
    const errors = validateForm()
    if (Object.keys(errors).length) {
      setValidationErrors(errors)
      return
    }

    setSubmitting(true)
    setError("")

    try {
      let savedContact
      if (editingContact) {
        savedContact = await updateContact(
          editingContact.id,
          firstName,
          lastName,
          email,
          title,
          organizationName,
          organizationIndustry,
          organizationWebsite,
          createdBy,
          modifiedBy || createdBy || "System"
        )
      } else {
        savedContact = await createContactWithOrgOnly(
          firstName,
          lastName,
          email,
          title,
          organizationName,
          organizationIndustry,
          organizationWebsite,
          buildNoteContent(),
          createdBy || "System"
        )
      }

      if (savedContact) {
        const contactWithOrg: Contact = {
          ...savedContact,
          organizations: { id: savedContact.organization_id || 0, name: organizationName }
        }

        let updatedList: Contact[] = []
        if (editingContact) {
          updatedList = (contacts.map((c) => (c.id === contactWithOrg.id ? contactWithOrg : c)))
          setContacts(updatedList)
        } else {
          updatedList = [contactWithOrg, ...contacts]
          setContacts(updatedList)
        }
        try { localStorage.setItem('contacts_list', JSON.stringify(updatedList)) } catch (e) {}
        // notify other pages
        window.dispatchEvent(new CustomEvent('contact-updated', { detail: contactWithOrg }))

        if (closeAfter) {
          closeDrawer()
        } else {
          if (!editingContact) resetForm()
        }
      }
    } catch (err: unknown) {
      console.error("Failed to save contact:", err)
      setError(err instanceof Error ? err.message : "Unable to save contact. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteContact = async (contactId: number) => {
    const confirmed = window.confirm("Delete this contact? This cannot be undone.")
    if (!confirmed) return

    try {
      await deleteContact(contactId)
      setContacts((prev) => prev.filter((c) => c.id !== contactId))
      try {
        const stored = JSON.parse(localStorage.getItem('contacts_list') || '[]') as Contact[]
        const filtered = stored.filter(c => c.id !== contactId)
        localStorage.setItem('contacts_list', JSON.stringify(filtered))
      } catch (e) {}
      window.dispatchEvent(new CustomEvent('contact-deleted', { detail: { id: contactId } }))
    } catch (err: unknown) {
      console.error("Failed to delete contact:", err)
      setError(err instanceof Error ? err.message : "Unable to delete contact. Please try again.")
    }
  }

  const handleSendIntroEmail = (contact: Contact) => {
    const template = getEmailTemplate(
      "Introductory Email",
      `${contact.first_name} ${contact.last_name}`,
      contact.organizations?.name || "your organization"
    )
    openGmailCompose(template, contact.email)
  }

  // Import modal handlers
  const handleFileChange = (file: File | null) => {
    if (!file) return
    
    const validTypes = ['.csv', '.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValidType = validTypes.some(type => fileName.endsWith(type))
    
    if (!isValidType) {
      setValidationErrorsList(['Invalid file format. Please upload CSV or XLSX files.'])
      return
    }
    
    setValidationErrorsList([])
    setUploadedFile(file)
    setUploadProgress(0)
    setImportSuccess(false)
    
    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadProgress(100)
        
        // Simulate successful import
        setTimeout(() => {
          setImportSuccess(true)
          setImportSummary({
            total: Math.floor(Math.random() * 100) + 50,
            successful: Math.floor(Math.random() * 80) + 40,
            failed: Math.floor(Math.random() * 20)
          })
        }, 500)
      } else {
        setUploadProgress(Math.round(progress))
      }
    }, 200)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragRef.current) dragRef.current.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragRef.current) dragRef.current.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragRef.current) dragRef.current.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50')
    
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileChange(files[0])
  }

  const downloadSampleCSV = () => {
    const csvContent = `First Name,Last Name,Email,Job Title,Organization,Phone
John,Doe,john.doe@example.com,Sales Manager,Acme Corp,+1-555-0100
Jane,Smith,jane.smith@example.com,Marketing Director,Tech Solutions,+1-555-0101
Mike,Johnson,mike.j@example.com,Product Lead,Innovation Inc,+1-555-0102`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_contacts.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const downloadSampleXLSX = () => {
    // For demo, we'll just show an alert since XLSX generation requires a library
    alert('Sample XLSX download: In a real app, this would use a library like xlsx to generate the file.')
  }

  const handleCRMImport = () => {
    if (!selectedCRM) {
      setValidationErrorsList(['Please select a CRM to import from.'])
      return
    }
    
    setValidationErrorsList([])
    setImportSuccess(false)
    setUploadProgress(0)
    
    // Simulate CRM import
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadProgress(100)
        
        setTimeout(() => {
          setImportSuccess(true)
          setImportSummary({
            total: Math.floor(Math.random() * 200) + 100,
            successful: Math.floor(Math.random() * 150) + 80,
            failed: Math.floor(Math.random() * 30)
          })
        }, 500)
      } else {
        setUploadProgress(Math.round(progress))
      }
    }, 300)
  }

  const closeImportModal = () => {
    setIsImportModalOpen(false)
    setUploadedFile(null)
    setUploadProgress(0)
    setImportSuccess(false)
    setSelectedCRM(null)
    setImportSummary({ total: 0, successful: 0, failed: 0 })
    setValidationErrorsList([])
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setFilterJobTitle("")
    setSortBy("newest")
  }

  const filteredContacts = contacts.filter((contact) => {
    const parsed = parseJobTitle(contact.job_title)
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase()

    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      parsed.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch && (!filterJobTitle || parsed.role.toLowerCase().includes(filterJobTitle.toLowerCase()))
  })

  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    }
    if (sortBy === "designation") {
      const parsedA = parseJobTitle(a.job_title)
      const parsedB = parseJobTitle(b.job_title)
      return parsedA.role.localeCompare(parsedB.role)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Unified view of your contacts, organizations, and sales pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <EmailComposerButton />
          <Button
            variant="outline"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>

          {/* Create Contact dropdown: Create / Import Contact / Import Notes */}
          <div className="relative inline-block text-left">
            <div className="flex">
              <Button onClick={openNewContactDrawer} className="rounded-l-xl">
                <Plus className="mr-2 h-4 w-4" /> Create Contact
              </Button>
              <button
                onClick={() => setCreateMenuOpen((s) => !s)}
                className="inline-flex items-center rounded-r-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 hover:bg-slate-50"
                aria-expanded={createMenuOpen}
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.12 1L10.56 13.06a.75.75 0 01-1.12 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" /></svg>
              </button>
            </div>

            {createMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1">
                  <button onClick={() => { setCreateMenuOpen(false); setIsImportModalOpen(true) }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-100">Import Contact</button>
                      <button onClick={() => { setCreateMenuOpen(false); router.push('/contacts/import-notes') }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-100">Import Notes</button>
                </div>
              </div>
            )}
          </div>
          <input ref={importNotesRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) alert(`Import notes file selected: ${file.name}`) }} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">Clear</button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, company..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "name" | "newest" | "designation")}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="newest">Newest Created</option>
                  <option value="name">Contact Name</option>
                  <option value="designation">Designation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Designation / Role</label>
                <input
                  type="text"
                  value={filterJobTitle}
                  onChange={(e) => setFilterJobTitle(e.target.value)}
                  placeholder="e.g. CHRO, HOD"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedContacts.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No contacts found matching the filters.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10 pl-4">
                        <input
                          type="checkbox"
                          checked={selectedRowIds.length === sortedContacts.length && sortedContacts.length > 0}
                          onChange={() => setSelectedRowIds(selectedRowIds.length === sortedContacts.length ? [] : sortedContacts.map((c) => c.id))}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="w-30 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContacts.map((contact) => {
                      const parsed = parseJobTitle(contact.job_title)
                      return (
                        <TableRow key={contact.id} onClick={() => { try { localStorage.setItem('selected_contact', JSON.stringify(contact)) } catch (e) {} ; router.push(`/contacts/${contact.id}`) }} className={selectedRowIds.includes(contact.id) ? "bg-blue-50/20 cursor-pointer hover:bg-slate-50" : "cursor-pointer hover:bg-slate-50"}>
                          <TableCell className="pl-4">
                            <input
                              type="checkbox"
                              checked={selectedRowIds.includes(contact.id)}
                              onChange={() => setSelectedRowIds((prev) => (prev.includes(contact.id) ? prev.filter((id) => id !== contact.id) : [...prev, contact.id]))}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">{contact.first_name} {contact.last_name}</TableCell>
                          <TableCell>{parsed.role}</TableCell>
                          <TableCell className="text-blue-600">{contact.email || "--"}</TableCell>
                          <TableCell>{parsed.phone}</TableCell>
                          <TableCell>{parsed.mobile}</TableCell>
                          <TableCell className="font-medium">{contact.organizations?.name || "--"}</TableCell>
                          <TableCell className="text-right space-x-1.5">
                            {contact.email && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={(e: any) => { e.stopPropagation(); handleSendIntroEmail(contact) }}
                                className="h-7 w-7 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e: any) => { e.stopPropagation(); openEditContactDrawer(contact) }}
                              className="h-7 w-7 border-slate-200 text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e: any) => { e.stopPropagation(); handleDeleteContact(contact.id) }}
                              className="h-7 w-7 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>
                    {selectedRowIds.length > 0 && (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">{selectedRowIds.length} selected</span>
                    )}
                    Total Records: {sortedContacts.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-[90vw] h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Sticky top header matching Zoho CRM */}
            <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Contact Information</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">{editingContact ? "Edit Contact" : "New Contact"}</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={closeDrawer} className="h-10 rounded-2xl">Cancel</Button>
                <Button type="button" onClick={() => handleSave(true)} className="h-10 rounded-2xl" disabled={submitting}>
                  {submitting ? "Saving..." : "Save & Close"}
                </Button>
                <Button type="button" onClick={() => handleSave(false)} className="h-10 rounded-2xl" disabled={submitting}>
                  Save
                </Button>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSave(true) }} className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {error && (
                  <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Contact Details</p>
                      <p className="mt-1 text-sm text-slate-500">Fill in contact details for the CRM record.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM Form</span>
                  </div>
                </div>

                {/* Two-column layout like Zoho CRM: Contact Information / Communication Details */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Owner</label>
                      <input
                        type="text"
                        value={contactOwner}
                        onChange={(e) => setContactOwner(e.target.value)}
                        placeholder="e.g. Sumit Sharma"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Sarah"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {validationErrors.firstName && <p className="mt-2 text-xs text-red-600">{validationErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Organization Name *</label>
                      <input
                        type="text"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        placeholder="e.g. Humppl Solutions"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {validationErrors.organizationName && <p className="mt-2 text-xs text-red-600">{validationErrors.organizationName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. sarah@humppl.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {validationErrors.email && <p className="mt-2 text-xs text-red-600">{validationErrors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 99999 99999"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Other Phone</label>
                      <input
                        type="text"
                        value={otherPhone}
                        onChange={(e) => setOtherPhone(e.target.value)}
                        placeholder="e.g. +91 88888 88888"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile</label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="e.g. +91 77777 77777"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assistant</label>
                      <input
                        type="text"
                        value={assistant}
                        onChange={(e) => setAssistant(e.target.value)}
                        placeholder="e.g. Pooja Sharma"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Created By</label>
                        <input
                          type="text"
                          value={createdBy}
                          onChange={(e) => setCreatedBy(e.target.value)}
                          placeholder="e.g. Admin"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                        />
                        {validationErrors.createdBy && <p className="mt-2 text-xs text-red-600">{validationErrors.createdBy}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Modified By</label>
                        <input
                          type="text"
                          value={modifiedBy}
                          onChange={(e) => setModifiedBy(e.target.value)}
                          placeholder="e.g. Admin"
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Lead Source</label>
                      <input
                        type="text"
                        value={leadSource}
                        onChange={(e) => setLeadSource(e.target.value)}
                        placeholder="e.g. Referral"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Connor"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {validationErrors.lastName && <p className="mt-2 text-xs text-red-600">{validationErrors.lastName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Chief Revenue Officer"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                      {validationErrors.title && <p className="mt-2 text-xs text-red-600">{validationErrors.title}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Human Resources"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Home Phone</label>
                      <input
                        type="text"
                        value={homePhone}
                        onChange={(e) => setHomePhone(e.target.value)}
                        placeholder="e.g. +91 77777 77777"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Fax</label>
                      <input
                        type="text"
                        value={fax}
                        onChange={(e) => setFax(e.target.value)}
                        placeholder="e.g. +91 12345 67890"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Assistant Phone</label>
                      <input
                        type="text"
                        value={assistantPhone}
                        onChange={(e) => setAssistantPhone(e.target.value)}
                        placeholder="e.g. +91 22222 22222"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        id="emailOptOut"
                        type="checkbox"
                        checked={emailOptOut}
                        onChange={(e) => setEmailOptOut(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="emailOptOut" className="text-sm text-slate-600">Email Opt Out</label>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Skype ID</label>
                      <input
                        type="text"
                        value={skypeId}
                        onChange={(e) => setSkypeId(e.target.value)}
                        placeholder="e.g. sarah.connor"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-5 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Address Information</p>
                      <p className="text-sm text-slate-500">Primary address and location details.</p>
                    </div>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 123 Business Ave"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Mumbai"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                      <input
                        type="text"
                        value={stateValue}
                        onChange={(e) => setStateValue(e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Zip Code</label>
                      <input
                        type="text"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        placeholder="e.g. 400001"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-5 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Additional Information</p>
                      <p className="text-sm text-slate-500">LinkedIn, website and notes for this contact.</p>
                    </div>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">LinkedIn Profile</label>
                      <input
                        type="text"
                        value={linkedInProfile}
                        onChange={(e) => setLinkedInProfile(e.target.value)}
                        placeholder="e.g. linkedin.com/in/sarahconnor"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
                      <input
                        type="text"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. www.humppl.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={5}
                        placeholder="Add context, background and details about the contact."
                        className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-[90vw] max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Import Contacts</h2>
                <p className="text-sm text-slate-500 mt-1">Upload contact records from a file or integrate with another CRM</p>
              </div>
              <button
                onClick={closeImportModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto">
              <div className="p-6 space-y-6">
                {/* Validation Errors */}
                {validationErrorsList.length > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 text-sm">Validation Errors</p>
                      <ul className="mt-2 space-y-1">
                        {validationErrorsList.map((error, idx) => (
                          <li key={idx} className="text-sm text-red-700">{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Two-card layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card 1: From File */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Upload className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">From File</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Upload contacts from CSV or Excel file</p>

                    {/* Drag & Drop Area */}
                    <div
                      ref={dragRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-blue-50 transition cursor-pointer mb-4"
                    >
                      <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-slate-700">Drag and drop your file here</p>
                      <p className="text-xs text-slate-500 mt-1">or</p>
                      <label className="inline-block mt-3">
                        <input
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <span className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition cursor-pointer">
                          Browse Files
                        </span>
                      </label>
                    </div>

                    {/* Upload Progress */}
                    {uploadedFile && uploadProgress < 100 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700">{uploadedFile.name}</p>
                          <p className="text-sm text-slate-500">{uploadProgress}%</p>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Success Message */}
                    {uploadedFile && uploadProgress === 100 && (
                      <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">{uploadedFile.name}</p>
                          <p className="text-xs text-green-700">Ready to import</p>
                        </div>
                      </div>
                    )}

                    {/* File Type Info */}
                    <div className="text-xs text-slate-500 space-y-1 mb-4">
                      <p>Accepted formats: CSV, XLSX, XLS</p>
                      <p>Max file size: 10 MB</p>
                    </div>

                    {/* Download Sample */}
                    <div className="space-y-2">
                      <button
                        onClick={downloadSampleCSV}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
                      >
                        <Download className="h-4 w-4" />
                        Download Sample CSV
                      </button>
                      <button
                        onClick={downloadSampleXLSX}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
                      >
                        <Download className="h-4 w-4" />
                        Download Sample XLSX
                      </button>
                    </div>
                  </div>

                  {/* Card 2: From Other CRMs */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <Upload className="h-6 w-6 text-blue-600" />
                      <h3 className="text-lg font-semibold text-slate-900">From Other CRMs</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-4">Import contacts from another CRM system</p>

                    {/* CRM Dropdown */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Select CRM</label>
                      <select
                        value={selectedCRM || ""}
                        onChange={(e) => setSelectedCRM((e.target.value as "zoho" | "salesforce" | "hubspot" | "pipedrive" | "freshsales") || null)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">Choose a CRM...</option>
                        <option value="zoho">Zoho CRM</option>
                        <option value="salesforce">Salesforce</option>
                        <option value="hubspot">HubSpot</option>
                        <option value="pipedrive">Pipedrive</option>
                        <option value="freshsales">Freshsales</option>
                      </select>
                    </div>

                    {/* CRM Info Box */}
                    {selectedCRM && (
                      <div className="mb-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">
                          {selectedCRM === "zoho" && "Connected to Zoho CRM. Click Import to start syncing contacts."}
                          {selectedCRM === "salesforce" && "Connected to Salesforce. Click Import to start syncing contacts."}
                          {selectedCRM === "hubspot" && "Connected to HubSpot. Click Import to start syncing contacts."}
                          {selectedCRM === "pipedrive" && "Connected to Pipedrive. Click Import to start syncing contacts."}
                          {selectedCRM === "freshsales" && "Connected to Freshsales. Click Import to start syncing contacts."}
                        </p>
                      </div>
                    )}

                    {/* Import Progress for CRM */}
                    {selectedCRM && uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-700">Importing from {selectedCRM}...</p>
                          <p className="text-sm text-slate-500">{uploadProgress}%</p>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Import Button */}
                    <button
                      onClick={handleCRMImport}
                      disabled={!selectedCRM || uploadProgress > 0}
                      className={`w-full px-4 py-3 rounded-lg font-medium text-white transition ${
                        selectedCRM && uploadProgress === 0
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-slate-300 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      {uploadProgress > 0 ? `Importing... ${uploadProgress}%` : "Start Import"}
                    </button>
                  </div>
                </div>

                {/* Import Summary */}
                {importSuccess && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <h3 className="text-lg font-semibold text-green-900">Import Summary</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-white border border-green-200">
                        <p className="text-xs text-slate-600 font-medium">Total Records</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{importSummary.total}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-green-200">
                        <p className="text-xs text-slate-600 font-medium">Imported Successfully</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{importSummary.successful}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-green-200">
                        <p className="text-xs text-slate-600 font-medium">Failed Records</p>
                        <p className="text-2xl font-bold text-red-600 mt-1">{importSummary.failed}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 border-t border-slate-200 bg-white px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={closeImportModal}
                className="px-6 py-2 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeImportModal()
                }}
                disabled={!importSuccess}
                className={`px-6 py-2 rounded-lg font-medium text-white transition ${
                  importSuccess
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                }`}
              >
                Complete Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
