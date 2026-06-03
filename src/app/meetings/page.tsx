'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, Calendar as CalendarIcon, X, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { getMeetings, createMeeting, getOrganizations } from "@/actions";

interface Organization {
  id: number;
  name: string;
}

interface Meeting {
  id: string;
  created_at: string;
  title: string;
  organization_id: number;
  date_time: string;
  status: string;
  organizations?: {
    name: string;
  } | null;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [status, setStatus] = useState("Scheduled");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho filters & sort
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"date_asc" | "date_desc" | "title">("date_asc");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [meetsData, orgsData] = await Promise.all([
          getMeetings(),
          getOrganizations()
        ]);
        setMeetings(meetsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load meetings data:", err);
        setError("Could not load meetings. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !organizationId || !dateTime) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const newMeet = await createMeeting(title, orgId, dateTime, status);
      if (newMeet) {
        const orgObj = organizations.find(o => o.id === orgId);
        const meetWithOrg: Meeting = {
          ...newMeet,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setMeetings([...meetings, meetWithOrg].sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()));
        setIsModalOpen(false);
        setTitle("");
        setDateTime("");
        setStatus("Scheduled");
      }
    } catch (err: any) {
      console.error("Failed to create meeting:", err);
      setError("Failed to schedule meeting. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setDateFilter("all");
    setStatusFilter("");
    setSortBy("date_asc");
  };

  // Checkboxes row handlers
  const toggleSelectRow = (meetingId: string) => {
    if (selectedRowIds.includes(meetingId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== meetingId));
    } else {
      setSelectedRowIds([...selectedRowIds, meetingId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredMeets: Meeting[]) => {
    if (selectedRowIds.length === currentFilteredMeets.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredMeets.map(m => m.id));
    }
  };

  const formatMeetingDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Local filtering
  const filteredMeetings = meetings.filter(meet => {
    const matchesSearch = 
      meet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meet.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || meet.status === statusFilter;

    // Date logic
    const mDate = new Date(meet.date_time);
    const today = new Date();
    let matchesDateRange = true;

    if (dateFilter === "today") {
      matchesDateRange = mDate.toDateString() === today.toDateString();
    } else if (dateFilter === "week") {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      matchesDateRange = mDate >= startOfWeek && mDate <= endOfWeek;
    } else if (dateFilter === "month") {
      matchesDateRange = mDate.getMonth() === today.getMonth() && mDate.getFullYear() === today.getFullYear();
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  // Local sorting
  const sortedMeetings = [...filteredMeetings].sort((a, b) => {
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "date_desc") {
      return new Date(b.date_time).getTime() - new Date(a.date_time).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.date_time).getTime() - new Date(b.date_time).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your calendar and client appointments.</p>
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
            <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Meeting
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
                <h3 className="font-bold text-sm text-gray-900">Filter Meetings by</h3>
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
                    placeholder="Search title, organization..."
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
                  <option value="title">Meeting Title</option>
                </select>
              </div>

              {/* Date Filters (Zoho format) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Filter By Date</label>
                <div className="space-y-1">
                  {[
                    { value: "all", label: "All Date Ranges" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This Week" },
                    { value: "month", label: "Current Month" }
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

              {/* Status checkboxes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Status</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          )}

          {/* Main Table view */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedMeetings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No scheduled meetings found matching filters.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedMeetings.length && sortedMeetings.length > 0}
                          onChange={() => toggleSelectAllRows(sortedMeetings)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Meeting Title</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMeetings.map((meeting) => (
                      <TableRow key={meeting.id} className={selectedRowIds.includes(meeting.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(meeting.id)}
                            onChange={() => toggleSelectRow(meeting.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{meeting.title}</TableCell>
                        <TableCell>{meeting.organizations?.name || '--'}</TableCell>
                        <TableCell>{formatMeetingDate(meeting.date_time)}</TableCell>
                        <TableCell>
                          <Badge variant={meeting.status === 'Completed' ? 'secondary' : 'default'}>
                            {meeting.status}
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
                    Total Records: {sortedMeetings.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Schedule Meeting</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kickoff Session" 
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
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
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !title || !organizationId || !dateTime}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Scheduling...
                    </>
                  ) : "Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
