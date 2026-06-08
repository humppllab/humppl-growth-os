'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, FileText, X, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { getProposals, createProposal, getOrganizations } from "@/actions";
import { formatRupees } from "@/lib/utils";
import EmailComposerButton from "@/components/ui/EmailComposerButton";
import ExportCsvButton from "@/components/ui/ExportCsvButton";
import Link from "next/link";

interface Organization {
  id: number;
  name: string;
}

interface Proposal {
  id: string;
  created_at: string;
  title: string;
  organization_id: number;
  value: number;
  date_sent: string;
  status: string;
  organizations?: {
    name: string;
  } | null;
}

const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Under Discussion",
  "Approval Pending",
  "Accepted",
  "Rejected",
  "Expired"
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("Draft");
  const [dateSent, setDateSent] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho filters & sorting
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "value_desc" | "value_asc" | "title">("newest");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [propsData, orgsData] = await Promise.all([
          getProposals(),
          getOrganizations()
        ]);
        setProposals(propsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load proposals data:", err);
        setError("Could not load proposals. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !organizationId || !value) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const valNum = parseFloat(value) || 0;
      const newProp = await createProposal(title, orgId, valNum, status, dateSent);
      if (newProp) {
        const orgObj = organizations.find(o => o.id === orgId);
        const propWithOrg: Proposal = {
          ...newProp,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setProposals([propWithOrg, ...proposals]);
        setIsModalOpen(false);
        setTitle("");
        setValue("");
        setStatus("Draft");
        setDateSent(new Date().toISOString().split('T')[0]);
      }
    } catch (err: any) {
      console.error("Failed to create proposal:", err);
      setError("Failed to create proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'Accepted': return 'success';
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Under Discussion': return 'warning';
      case 'Approval Pending': return 'warning';
      case 'Rejected': return 'destructive';
      case 'Expired': return 'outline';
      default: return 'default';
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setMinValue("");
    setMaxValue("");
    setSortBy("newest");
  };

  // Checkboxes row handlers
  const toggleSelectRow = (pId: string) => {
    if (selectedRowIds.includes(pId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== pId));
    } else {
      setSelectedRowIds([...selectedRowIds, pId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredProps: Proposal[]) => {
    if (selectedRowIds.length === currentFilteredProps.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredProps.map(p => p.id));
    }
  };

  // Local filtering
  const filteredProposals = proposals.filter(prop => {
    const matchesSearch = 
      prop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prop.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || prop.status === statusFilter;
    
    const val = prop.value || 0;
    const matchesMin = !minValue || val >= parseFloat(minValue);
    const matchesMax = !maxValue || val <= parseFloat(maxValue);

    return matchesSearch && matchesStatus && matchesMin && matchesMax;
  });

  // Local sorting
  const sortedProposals = [...filteredProposals].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "value_desc") {
      return b.value - a.value;
    }
    if (sortBy === "value_asc") {
      return a.value - b.value;
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
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">Track proposal statuses and document lifecycles.</p>
        </div>
        <div className="flex items-center gap-3">
          <EmailComposerButton />
          <ExportCsvButton module="proposals" />
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Proposal
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
          {/* Collapsible Zoho Filter panel */}
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Proposals by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Clear
                </button>
              </div>

              {/* Search text */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, client..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Sort selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="newest">Newest Created</option>
                  <option value="value_desc">Value: High to Low</option>
                  <option value="value_asc">Value: Low to High</option>
                  <option value="title">Proposal Title</option>
                </select>
              </div>

              {/* Value Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Value (INR)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Proposal Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  {PROPOSAL_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Main Table view */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedProposals.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No proposals found matching filters.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedProposals.length && sortedProposals.length > 0}
                          onChange={() => toggleSelectAllRows(sortedProposals)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Proposal Title</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Date Sent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProposals.map((proposal) => (
                      <TableRow key={proposal.id} className={selectedRowIds.includes(proposal.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(proposal.id)}
                            onChange={() => toggleSelectRow(proposal.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600 flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                          <Link href={`/proposals/${proposal.id}`} className="hover:underline">
                            {proposal.title}
                          </Link>
                        </TableCell>
                        <TableCell>{proposal.organizations?.name || '--'}</TableCell>
                        <TableCell className="font-semibold text-gray-900">{formatRupees(proposal.value)}</TableCell>
                        <TableCell>{formatDateString(proposal.date_sent)}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(proposal.status)}>
                            {proposal.status}
                          </Badge>
                        </TableCell>
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
                    Total Records: {sortedProposals.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Create New Proposal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HR Transformation Blueprint" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Organization *</label>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value (INR) *</label>
                  <input 
                    type="number" 
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 100000" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    {PROPOSAL_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Sent *</label>
                <input 
                  type="date" 
                  required
                  value={dateSent}
                  onChange={(e) => setDateSent(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !title || !organizationId || !value}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
