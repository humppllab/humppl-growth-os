'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, Trash2, RefreshCw, Tag, FileText, Layers, Upload, Download, Printer } from "lucide-react";
import { getFollowUps, createFollowUp, getOrganizations, toggleFollowUpStatus } from "@/actions";
import EmailComposerButton from "@/components/ui/EmailComposerButton";
import { ThreeDotMenu, ThreeDotMenuItemProps } from "@/components/ui/ThreeDotMenu";

interface Organization {
  id: number;
  name: string;
}

interface FollowUp {
  id: string;
  created_at: string;
  organization_id: number;
  date: string;
  owner: string;
  status: string;
  organizations?: {
    name: string;
  } | null;
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [date, setDate] = useState("");
  const [owner, setOwner] = useState("Sumit");
  const [status, setStatus] = useState("Pending");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho filters & sort
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "overdue">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date_asc" | "date_desc" | "owner">("date_asc");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [followUpsData, orgsData] = await Promise.all([
          getFollowUps(),
          getOrganizations()
        ]);
        setFollowUps(followUpsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load follow-ups data:", err);
        setError("Could not load follow-ups. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !date || !owner) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const newFollowUp = await createFollowUp(orgId, date, owner, status);
      if (newFollowUp) {
        const orgObj = organizations.find(o => o.id === orgId);
        const followUpWithOrg: FollowUp = {
          ...newFollowUp,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setFollowUps([...followUps, followUpWithOrg].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsModalOpen(false);
        setDate("");
        setOwner("Sumit");
        setStatus("Pending");
      }
    } catch (err: any) {
      console.error("Failed to create follow-up:", err);
      setError("Failed to create follow-up. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const updated = await toggleFollowUpStatus(id, currentStatus);
      if (updated) {
        setFollowUps(followUps.map(f => f.id === id ? { ...f, status: updated.status } : f));
      }
    } catch (err) {
      console.error("Failed to toggle follow-up status:", err);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setStatusFilter("");
    setSortBy("date_asc");
  };

  // Checkboxes row handlers
  const toggleSelectRow = (fId: string) => {
    if (selectedRowIds.includes(fId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== fId));
    } else {
      setSelectedRowIds([...selectedRowIds, fId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredFollowUps: FollowUp[]) => {
    if (selectedRowIds.length === currentFilteredFollowUps.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredFollowUps.map(f => f.id));
    }
  };

  const formatFollowUpDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return { text: "Today", isAlert: true };
      }
      if (d.toDateString() === yesterday.toDateString()) {
        return { text: "Yesterday", isAlert: true };
      }

      return {
        text: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        isAlert: d < today && status !== 'Completed'
      };
    } catch (e) {
      return { text: dateStr, isAlert: false };
    }
  };

  // Local filtering
  const filteredFollowUps = followUps.filter(followUp => {
    const matchesSearch = 
      (followUp.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      followUp.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || followUp.status === statusFilter;

    // Date range filter
    const mDate = new Date(followUp.date);
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let matchesDateRange = true;
    if (dateFilter === "today") {
      matchesDateRange = mDate.toDateString() === today.toDateString();
    } else if (dateFilter === "tomorrow") {
      matchesDateRange = mDate.toDateString() === tomorrow.toDateString();
    } else if (dateFilter === "overdue") {
      matchesDateRange = mDate < today && followUp.status !== 'Completed';
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Local sorting
  const sortedFollowUps = [...filteredFollowUps].sort((a, b) => {
    if (sortBy === "owner") {
      return a.owner.localeCompare(b.owner);
    }
    if (sortBy === "date_desc") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-1">Track pending client communications and actions.</p>
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
          <ThreeDotMenu
            items={[
              { label: "Mass Delete", href: "/follow-ups/mass-delete", icon: <Trash2 className="h-4 w-4" />, variant: "destructive" },
              { label: "Mass Update", href: "/follow-ups/mass-update", icon: <RefreshCw className="h-4 w-4" /> },
              { label: "Manage Tags", href: "/follow-ups/manage-tags", icon: <Tag className="h-4 w-4" /> },
              { label: "Drafts", href: "/follow-ups/drafts", icon: <FileText className="h-4 w-4" /> },
              { label: "Deduplicate", href: "/follow-ups/deduplicate", icon: <Layers className="h-4 w-4" /> },
              { divider: true } as ThreeDotMenuItemProps,
              { label: "Import", href: "/follow-ups/import", icon: <Upload className="h-4 w-4" /> },
              { label: "Export", href: "/follow-ups/export", icon: <Download className="h-4 w-4" /> },
              { label: "Print View", href: "/follow-ups/print-view", icon: <Printer className="h-4 w-4" /> },
            ]}
          />

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Follow-up
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
                <h3 className="font-bold text-sm text-gray-900">Filter Follow-ups by</h3>
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
                    placeholder="Search company, owner..."
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
                  <option value="date_asc">Date: Earliest First</option>
                  <option value="date_desc">Date: Latest First</option>
                  <option value="owner">Owner</option>
                </select>
              </div>

              {/* Date Filters (Zoho format) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Filter By Date</label>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "All Dates" },
                    { value: "today", label: "Today" },
                    { value: "tomorrow", label: "Tomorrow" },
                    { value: "overdue", label: "Overdue Items" }
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center text-xs text-gray-600 hover:text-gray-900 cursor-pointer select-none">
                      <input 
                        type="radio" 
                        name="dateFilter"
                        checked={dateFilter === opt.value}
                        onChange={() => setDateFilter(opt.value as any)}
                        className="mr-2 h-3.5 w-3.5 border-gray-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          {/* Main Table view */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedFollowUps.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No follow-ups found matching filters.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedFollowUps.length && sortedFollowUps.length > 0}
                          onChange={() => toggleSelectAllRows(sortedFollowUps)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Client / Company</TableHead>
                      <TableHead>Follow-Up Date</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status (Click to toggle)</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedFollowUps.map((followUp) => {
                      const dateInfo = formatFollowUpDate(followUp.date);
                      return (
                        <TableRow key={followUp.id} className={selectedRowIds.includes(followUp.id) ? 'bg-blue-50/20' : ''}>
                          <TableCell className="pl-4">
                            <input 
                              type="checkbox"
                              checked={selectedRowIds.includes(followUp.id)}
                              onChange={() => toggleSelectRow(followUp.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{followUp.organizations?.name || '--'}</TableCell>
                          <TableCell className={dateInfo.isAlert && followUp.status !== 'Completed' ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                            {dateInfo.text}
                          </TableCell>
                          <TableCell>{followUp.owner}</TableCell>
                          <TableCell>
                            <button 
                              onClick={() => handleToggleStatus(followUp.id, followUp.status)}
                              className="focus:outline-none transition-transform active:scale-95"
                            >
                              <Badge variant={followUp.status === 'Completed' ? 'success' : 'warning'}>
                                {followUp.status}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
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
                    Total Records: {sortedFollowUps.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Follow-up Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add New Follow-up</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Date *</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                <input 
                  type="text" 
                  required
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g. Sumit" 
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
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !organizationId || !date || !owner}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create Follow-up"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
