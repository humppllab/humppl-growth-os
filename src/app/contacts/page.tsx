'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { getContacts, createContact, getOrganizations } from "@/actions";

interface Organization {
  id: number;
  name: string;
}

interface Contact {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  organization_id: number;
  organizations?: {
    name: string;
  } | null;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho Filters state
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOrgId, setFilterOrgId] = useState("");
  const [filterJobTitle, setFilterJobTitle] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "newest" | "designation">("newest");
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [contactsData, orgsData] = await Promise.all([
          getContacts(),
          getOrganizations()
        ]);
        setContacts(contactsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err: any) {
        console.error("Failed to load contacts data:", err);
        setError("Could not load contacts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !organizationId) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const newContact = await createContact(firstName, lastName, email, jobTitle, orgId);
      if (newContact) {
        const orgObj = organizations.find(o => o.id === orgId);
        const contactWithOrg: Contact = {
          ...newContact,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setContacts([contactWithOrg, ...contacts]);
        setIsModalOpen(false);
        setFirstName("");
        setLastName("");
        setEmail("");
        setJobTitle("");
      }
    } catch (err: any) {
      console.error("Failed to create contact:", err);
      setError("Failed to create contact. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterOrgId("");
    setFilterJobTitle("");
    setSortBy("newest");
  };

  // Checkbox row handlers
  const toggleSelectRow = (contactId: number) => {
    if (selectedRowIds.includes(contactId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== contactId));
    } else {
      setSelectedRowIds([...selectedRowIds, contactId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredContacts: Contact[]) => {
    if (selectedRowIds.length === currentFilteredContacts.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredContacts.map(c => c.id));
    }
  };

  // Local filtering
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.job_title || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesOrg = !filterOrgId || contact.organization_id === parseInt(filterOrgId);
    
    const matchesJob = !filterJobTitle || 
      (contact.job_title || "").toLowerCase().includes(filterJobTitle.toLowerCase());

    return matchesSearch && matchesOrg && matchesJob;
  });

  // Local sorting
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    }
    if (sortBy === "designation") {
      return (a.job_title || "").localeCompare(b.job_title || "");
    }
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your contacts and client relationships.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Contact
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="flex gap-6 items-start">
          {/* Zoho Collapsible Filter panel */}
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Contacts by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Clear
                </button>
              </div>

              {/* Text search */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, email, job..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="newest">Newest Created</option>
                  <option value="name">Contact Name</option>
                  <option value="designation">Designation</option>
                </select>
              </div>

              {/* Filter by Organization */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Organization</label>
                <select 
                  value={filterOrgId}
                  onChange={(e) => setFilterOrgId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Organizations</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter by Designation */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Designation / Role</label>
                <input 
                  type="text" 
                  value={filterJobTitle}
                  onChange={(e) => setFilterJobTitle(e.target.value)}
                  placeholder="e.g. CHRO, Director"
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}

          {/* Main Table panel */}
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
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedContacts.length && sortedContacts.length > 0}
                          onChange={() => toggleSelectAllRows(sortedContacts)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContacts.map((contact) => (
                      <TableRow key={contact.id} className={selectedRowIds.includes(contact.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(contact.id)}
                            onChange={() => toggleSelectRow(contact.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </TableCell>
                        <TableCell>{contact.job_title || '--'}</TableCell>
                        <TableCell className="text-blue-600">{contact.email || '--'}</TableCell>
                        <TableCell>{contact.organizations?.name || '--'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Zoho CRM style Total Records bar */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>
                    {selectedRowIds.length > 0 && (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                        {selectedRowIds.length} selected
                      </span>
                    )}
                    Total Records: {sortedContacts.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add New Contact</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input 
                    type="text" 
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Sarah" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input 
                    type="text" 
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Connor" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@techcorp.com" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <input 
                  type="text" 
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. CHRO, VP HR" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                {organizations.length === 0 ? (
                  <p className="text-sm text-red-500">Please create an organization first.</p>
                ) : (
                  <select 
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !firstName || !lastName || !organizationId}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create Contact"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
