'use client'

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, Mail, Upload, FileText, ChevronDown } from "lucide-react";
import { getContacts, createContactWithOrgAndOpp } from "@/actions";
import { OPPORTUNITY_TYPES, PIPELINE_STAGES, getEmailTemplate, openGmailCompose } from "@/lib/templates";
import EmailComposerButton from "@/components/ui/EmailComposerButton";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Unified Form State
  // Contact details
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");

  // Organization details
  const [orgName, setOrgName] = useState("");
  const [orgIndustry, setOrgIndustry] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");

  // Opportunity details
  const [oppName, setOppName] = useState("");
  const [oppType, setOppType] = useState(OPPORTUNITY_TYPES[0]);
  const [oppStage, setOppStage] = useState(PIPELINE_STAGES[0]);
  const [oppValue, setOppValue] = useState("");
  const [oppOwner, setOppOwner] = useState("Sumit");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho Filters state
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJobTitle, setFilterJobTitle] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "newest" | "designation">("newest");
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [isThreeDotMenuOpen, setIsThreeDotMenuOpen] = useState(false);
  const threeDotMenuRef = useRef<HTMLDivElement>(null);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (err: any) {
        console.error("Failed to load contacts:", err);
        setError("Could not load contacts. Please refresh and try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Close three dot menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (threeDotMenuRef.current && !threeDotMenuRef.current.contains(event.target as Node)) {
        setIsThreeDotMenuOpen(false);
      }
    }

    if (isThreeDotMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isThreeDotMenuOpen]);

  // Close create menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    }

    if (isCreateMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isCreateMenuOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !orgName || !oppName || !oppValue) {
      setError("Please fill out all required fields marked with *.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const valNum = parseFloat(oppValue) || 0;
      const res = await createContactWithOrgAndOpp(
        firstName,
        lastName,
        email,
        jobTitle,
        phone,
        mobile,
        orgName,
        orgIndustry,
        orgWebsite,
        oppName,
        oppType,
        oppStage,
        valNum,
        oppOwner
      );

      if (res) {
        // Construct visual contact representation with organization name linked
        const contactWithOrg: Contact = {
          ...res.contact,
          organizations: { name: orgName }
        };
        setContacts([contactWithOrg, ...contacts]);
        setIsModalOpen(false);
        
        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setJobTitle("");
        setPhone("");
        setMobile("");
        setOrgName("");
        setOrgIndustry("");
        setOrgWebsite("");
        setOppName("");
        setOppValue("");
        setOppType(OPPORTUNITY_TYPES[0]);
        setOppStage(PIPELINE_STAGES[0]);
      }
    } catch (err: any) {
      console.error("Failed to execute unified creation:", err);
      setError(err.message || "Failed to create unified contact profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Parsing helper for phone / mobile formatted inside job_title
  const parseJobTitle = (title: string) => {
    if (!title) return { role: '--', phone: '--', mobile: '--' };
    const parts = title.split(' | ');
    const role = parts[0] || '--';
    
    let phoneVal = '--';
    let mobileVal = '--';
    
    parts.forEach(p => {
      if (p.startsWith('Ph: ')) phoneVal = p.substring(4);
      if (p.startsWith('Mob: ')) mobileVal = p.substring(5);
    });
    
    return { role, phone: phoneVal, mobile: mobileVal };
  };

  const handleSendIntroEmail = (contact: Contact) => {
    const parsed = parseJobTitle(contact.job_title);
    const template = getEmailTemplate(
      "Introductory Email", 
      `${contact.first_name} ${contact.last_name}`, 
      contact.organizations?.name || "your organization"
    );
    openGmailCompose(template, contact.email);
  };

  const handleGeneralEmail = () => {
    const template = getEmailTemplate("Introductory Email");
    openGmailCompose(template, "");
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterJobTitle("");
    setSortBy("newest");
  };

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
    const parsed = parseJobTitle(contact.job_title);
    const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
    
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      (contact.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      parsed.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesJob = !filterJobTitle || 
      parsed.role.toLowerCase().includes(filterJobTitle.toLowerCase());

    return matchesSearch && matchesJob;
  });

  // Local sorting
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (sortBy === "name") {
      return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    }
    if (sortBy === "designation") {
      const parsedA = parseJobTitle(a.job_title);
      const parsedB = parseJobTitle(b.job_title);
      return parsedA.role.localeCompare(parsedB.role);
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
          
          {/* Three Dot Menu */}
          <div ref={threeDotMenuRef} className="relative">
            <Button 
              variant="outline"
              onClick={() => setIsThreeDotMenuOpen(!isThreeDotMenuOpen)}
              className="h-10 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-slate-100"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {/* Dropdown */}
            {isThreeDotMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <Link href="/contacts/mass-delete" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Mass Delete</button>
                </Link>
                <Link href="/contacts/mass-update" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Mass Update</button>
                </Link>
                <Link href="/contacts/manage-tags" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Manage Tags</button>
                </Link>
                <Link href="/contacts/drafts" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Drafts</button>
                </Link>
                <Link href="/contacts/deduplicate" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Deduplicate</button>
                </Link>
                <Link href="/contacts/export-contacts" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Export Contacts</button>
                </Link>
                <hr className="my-1" />
                <Link href="/contacts/sheet-view" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Sheet View</button>
                </Link>
                <Link href="/contacts/print-view" className="block" onClick={() => setIsThreeDotMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium">Print View</button>
                </Link>
              </div>
            )}
          </div>

          {/* Create Contact Dropdown */}
          <div ref={createMenuRef} className="relative">
            <Button 
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="h-10"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Contact
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
            {/* Dropdown Menu */}
            {isCreateMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsCreateMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Contact
                </button>
                <Link href="/contacts/import" className="block" onClick={() => setIsCreateMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Import Contacts
                  </button>
                </Link>
                <Link href="/contacts/import-notes" className="block" onClick={() => setIsCreateMenuOpen(false)}>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-medium flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Import Notes
                  </button>
                </Link>
              </div>
            )}
          </div>
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
                <h3 className="font-bold text-sm text-gray-900">Filter by</h3>
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
                    placeholder="Search name, email, company..."
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

              {/* Filter by Designation */}
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
                      <TableHead>Phone</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="w-[120px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedContacts.map((contact) => {
                      const parsed = parseJobTitle(contact.job_title);
                      return (
                        <TableRow key={contact.id} className={selectedRowIds.includes(contact.id) ? 'bg-blue-50/20' : ''}>
                          <TableCell className="pl-4">
                            <input 
                              type="checkbox"
                              checked={selectedRowIds.includes(contact.id)}
                              onChange={() => toggleSelectRow(contact.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </TableCell>
                          <TableCell>{parsed.role}</TableCell>
                          <TableCell className="text-blue-600">{contact.email || '--'}</TableCell>
                          <TableCell>{parsed.phone}</TableCell>
                          <TableCell>{parsed.mobile}</TableCell>
                          <TableCell className="font-medium">{contact.organizations?.name || '--'}</TableCell>
                          <TableCell className="text-right space-x-1.5">
                            {contact.email && (
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleSendIntroEmail(contact)}
                                className="h-7 w-7 border-blue-200 text-blue-600 hover:bg-blue-50"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <div className="inline-block relative group">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              {/* Dropdown Menu */}
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg hidden group-hover:block z-50">
                                <Link href={`/contacts/${contact.id}`} className="block">
                                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">View Details</button>
                                </Link>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Edit</button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add to Tag</button>
                                <hr className="my-1" />
                                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Delete</button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

      {/* Add Unified Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between shrink-0">
              <h2 className="font-bold text-gray-900 text-lg">Add New Contact Profile</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* SECTION 1: CONTACT DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-1">1. Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
                    <input 
                      type="text" 
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Sarah" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
                    <input 
                      type="text" 
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Connor" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sarah@techcorp.com" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Designation / Role</label>
                    <input 
                      type="text" 
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. CHRO, VP HR" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 99999 99999" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Mobile Number</label>
                    <input 
                      type="text" 
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. +91 88888 88888" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: COMPANY PROFILE */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-1">2. Company / Organization Details</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Organization Name *</label>
                  <input 
                    type="text" 
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. TechCorp Industries" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Industry</label>
                    <input 
                      type="text" 
                      value={orgIndustry}
                      onChange={(e) => setOrgIndustry(e.target.value)}
                      placeholder="e.g. Technology, Finance" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Website URL</label>
                    <input 
                      type="text" 
                      value={orgWebsite}
                      onChange={(e) => setOrgWebsite(e.target.value)}
                      placeholder="e.g. www.techcorp.com" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: OPPORTUNITY SETUP */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest border-b pb-1">3. Opportunity / Deal Setup</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Opportunity Name *</label>
                    <input 
                      type="text" 
                      required
                      value={oppName}
                      onChange={(e) => setOppName(e.target.value)}
                      placeholder="e.g. HR Transformation 2024" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Deal Value (INR) *</label>
                    <input 
                      type="number" 
                      required
                      value={oppValue}
                      onChange={(e) => setOppValue(e.target.value)}
                      placeholder="e.g. 50000" 
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Opportunity Type *</label>
                    <select 
                      value={oppType}
                      onChange={(e) => setOppType(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {OPPORTUNITY_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pipeline Stage *</label>
                    <select 
                      value={oppStage}
                      onChange={(e) => setOppStage(e.target.value)}
                      className="w-full px-4 py-2 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Owner *</label>
                  <input 
                    type="text" 
                    required
                    value={oppOwner}
                    onChange={(e) => setOppOwner(e.target.value)}
                    placeholder="e.g. Sumit" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Saving Profile...
                    </>
                  ) : "Create Contact & Align CRM"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
