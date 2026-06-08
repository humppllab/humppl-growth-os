'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, ArrowUpDown, ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";
import { getLeads, createLead, updateLead, convertLeadToOpportunity } from "@/actions";
import { toast } from "@/components/ui/Toast";

interface Lead {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  mobile?: string;
  job_title?: string;
  organization_name: string;
  source?: string;
  campaign_source?: string;
  referral_source?: string;
  lead_quality?: 'High' | 'Medium' | 'Low';
  priority_score?: number;
  owner?: string;
  qualification_status?: 'Raw' | 'Contacted' | 'Qualified' | 'Nurture' | 'Disqualified';
  converted: boolean;
}

const SOURCES = ["Website", "LinkedIn Outbound", "Referral", "Campus Event", "Direct Email", "Partner Referral", "Other"];
const QUALITY_LEVELS = ["High", "Medium", "Low"];
const STATUSES = ["Raw", "Contacted", "Qualified", "Nurture", "Disqualified"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [orgName, setOrgName] = useState("");
  const [source, setSource] = useState(SOURCES[0]);
  const [leadQuality, setLeadQuality] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [priorityScore, setPriorityScore] = useState("50");
  const [owner, setOwner] = useState("humppllab@humppl.com");

  // Conversion Modal State
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [oppName, setOppName] = useState("");
  const [oppValue, setOppValue] = useState("");
  const [oppOwner, setOppOwner] = useState("humppllab@humppl.com");
  const [converting, setConverting] = useState(false);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "priority_desc" | "name">("newest");
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getLeads();
        setLeads(data);
      } catch (err: any) {
        console.error("Failed to load leads:", err);
        setError("Failed to load leads. Please check your database connection.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !orgName || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const newLead = await createLead({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        mobile,
        job_title: jobTitle,
        organization_name: orgName,
        source,
        lead_quality: leadQuality,
        priority_score: parseInt(priorityScore) || 0,
        owner,
        qualification_status: 'Raw'
      });
      if (newLead) {
        setLeads([newLead, ...leads]);
        toast.success("Lead added successfully.");
        setIsCreateOpen(false);
        // reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhone("");
        setMobile("");
        setJobTitle("");
        setOrgName("");
        setSource(SOURCES[0]);
        setLeadQuality('Medium');
        setPriorityScore("50");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add lead: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertClick = (lead: Lead) => {
    setSelectedLead(lead);
    setOppName(`Consulting for ${lead.organization_name}`);
    setOppValue("500000"); // default value
    setOppOwner(lead.owner || "humppllab@humppl.com");
    setIsConvertOpen(true);
  };

  const handleConvertSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !oppName || !oppValue) return;
    setConverting(true);
    try {
      const result = await convertLeadToOpportunity(
        selectedLead.id,
        oppName,
        parseFloat(oppValue) || 0,
        oppOwner
      );
      if (result) {
        toast.success("Lead converted to Opportunity successfully!");
        setLeads(prev => prev.map(l => l.id === selectedLead.id ? { ...l, converted: true, qualification_status: 'Qualified' } : l));
        setIsConvertOpen(false);
        setSelectedLead(null);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to convert lead: " + err.message);
    } finally {
      setConverting(false);
    }
  };

  const archiveSelectedLeads = async () => {
    if (selectedRowIds.length === 0) return;
    try {
      await Promise.all(selectedRowIds.map(id => updateLead(id, { archived: true })));
      setLeads(prev => prev.filter(l => !selectedRowIds.includes(l.id)));
      setSelectedRowIds([]);
      toast.success("Selected leads archived (soft deleted).");
    } catch (err: any) {
      console.error(err);
      toast.error("Error archiving leads.");
    }
  };

  // Filters logic
  const handleCheckboxFilter = (list: string[], setList: Function, val: string) => {
    if (list.includes(val)) {
      setList(list.filter(item => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSources([]);
    setSelectedQuality([]);
    setSelectedStatus([]);
    setSortBy("newest");
  };

  const filteredLeads = leads.filter(l => {
    const matchesSearch = 
      (l.first_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.last_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.organization_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.email || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSource = selectedSources.length === 0 || (l.source && selectedSources.includes(l.source));
    const matchesQuality = selectedQuality.length === 0 || (l.lead_quality && selectedQuality.includes(l.lead_quality));
    const matchesStatus = selectedStatus.length === 0 || (l.qualification_status && selectedStatus.includes(l.qualification_status));
    const isNotConverted = !l.converted;

    return matchesSearch && matchesSource && matchesQuality && matchesStatus && isNotConverted;
  });

  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "name") {
      return (a.first_name || "").localeCompare(b.first_name || "");
    }
    if (sortBy === "priority_desc") {
      return (b.priority_score || 0) - (a.priority_score || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const toggleSelectRow = (id: number) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter(x => x !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & Prospects</h1>
          <p className="text-sm text-gray-500 mt-1">Capture outreach interactions and qualify leads into opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedRowIds.length > 0 && (
            <Button variant="destructive" onClick={archiveSelectedLeads}>
              Archive ({selectedRowIds.length})
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Lead
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
          {/* Collapsible Zoho Filter Panel */}
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Leads by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Clear
                </button>
              </div>

              {/* Text Search */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, company..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="newest">Newest Created</option>
                  <option value="priority_desc">Priority Score: High-Low</option>
                  <option value="name">First Name</option>
                </select>
              </div>

              {/* Lead Quality Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Lead Quality</label>
                <div className="space-y-1.5">
                  {QUALITY_LEVELS.map(q => (
                    <label key={q} className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedQuality.includes(q)}
                        onChange={() => handleCheckboxFilter(selectedQuality, setSelectedQuality, q)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      {q}
                    </label>
                  ))}
                </div>
              </div>

              {/* Source Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Lead Source</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {SOURCES.map(src => (
                    <label key={src} className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedSources.includes(src)}
                        onChange={() => handleCheckboxFilter(selectedSources, setSelectedSources, src)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      {src}
                    </label>
                  ))}
                </div>
              </div>

              {/* Qualification Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Status</label>
                <div className="space-y-1.5">
                  {STATUSES.map(st => (
                    <label key={st} className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedStatus.includes(st)}
                        onChange={() => handleCheckboxFilter(selectedStatus, setSelectedStatus, st)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      {st}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Table area */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedLeads.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No matching active leads found. Adjust your filters or add a new lead.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedLeads.length && sortedLeads.length > 0}
                          onChange={() => {
                            if (selectedRowIds.length === sortedLeads.length) setSelectedRowIds([]);
                            else setSelectedRowIds(sortedLeads.map(l => l.id));
                          }}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                        />
                      </TableHead>
                      <TableHead>Lead Name</TableHead>
                      <TableHead>Organization Name</TableHead>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Quality</TableHead>
                      <TableHead>Priority Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead className="w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedLeads.map((lead) => (
                      <TableRow key={lead.id} className={selectedRowIds.includes(lead.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(lead.id)}
                            onChange={() => toggleSelectRow(lead.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <Link href={`/leads/${lead.id}`} className="hover:underline">
                            {lead.first_name} {lead.last_name}
                          </Link>
                        </TableCell>
                        <TableCell>{lead.organization_name}</TableCell>
                        <TableCell className="text-xs text-gray-500">{lead.job_title || '--'}</TableCell>
                        <TableCell>
                          <Badge variant={lead.lead_quality === 'High' ? 'default' : lead.lead_quality === 'Medium' ? 'secondary' : 'outline'}>
                            {lead.lead_quality}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-700">{lead.priority_score || 0}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.qualification_status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{lead.owner || '--'}</TableCell>
                        <TableCell className="space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleConvertClick(lead)}
                            className="text-xs h-7 px-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                          >
                            <UserCheck className="h-3 w-3 mr-1" /> Convert
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>Total Leads: {sortedLeads.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add New Lead</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name *</label>
                  <input 
                    type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Aditi" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name *</label>
                  <input 
                    type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Verma" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name *</label>
                  <input 
                    type="text" required value={orgName} onChange={(e) => setOrgName(e.target.value)}
                    placeholder="e.g. Tech Solutions Corp" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title</label>
                  <input 
                    type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="CHRO, Placement Head" className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="Landline" className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile</label>
                  <input 
                    type="text" value={mobile} onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile" className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                  <select 
                    value={source} onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Quality</label>
                  <select 
                    value={leadQuality} onChange={(e) => setLeadQuality(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {QUALITY_LEVELS.map(q => <option key={q} value={q}>{q}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Score (0-100)</label>
                  <input 
                    type="number" min="0" max="100" value={priorityScore} onChange={(e) => setPriorityScore(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Owner</label>
                <input 
                  type="text" required value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead Modal */}
      {isConvertOpen && selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Convert Lead to Opportunity</h2>
              <button onClick={() => setIsConvertOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleConvertSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl text-xs space-y-2 border border-emerald-100">
                <p className="font-bold">This conversion will automatically: </p>
                <ul className="list-disc pl-4 space-y-1 font-medium">
                  <li>Create Company organization: <strong>{selectedLead.organization_name}</strong></li>
                  <li>Create Stakeholder Contact: <strong>{selectedLead.first_name} {selectedLead.last_name}</strong></li>
                  <li>Mark this lead as Qualified / Converted</li>
                </ul>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity Name *</label>
                <input 
                  type="text" required value={oppName} onChange={(e) => setOppName(e.target.value)}
                  placeholder="e.g. Growth Engagement Q3" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Estimated Deal Value (INR) *</label>
                <input 
                  type="number" required value={oppValue} onChange={(e) => setOppValue(e.target.value)}
                  placeholder="e.g. 500000" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Opportunity Owner *</label>
                <input 
                  type="text" required value={oppOwner} onChange={(e) => setOppOwner(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsConvertOpen(false)} disabled={converting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={converting || !oppName || !oppValue} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {converting ? "Converting..." : "Convert Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
