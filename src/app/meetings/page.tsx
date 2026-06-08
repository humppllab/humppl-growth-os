'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, Calendar as CalendarIcon, X, Loader2, Search, SlidersHorizontal, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { getMeetings, createMeeting, getOrganizations, updateMeetingDateTime } from "@/actions";
import { toast } from "@/components/ui/Toast";
import Link from "next/link";

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

  // Google Calendar Integration states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleIsSandbox, setGoogleIsSandbox] = useState(false);
  const [syncToCalendar, setSyncToCalendar] = useState(true);
  const [showSyncedCalendarModal, setShowSyncedCalendarModal] = useState(false);
  
  // Synced Calendar visualizer grid month
  const [visualCalendarMonth, setVisualCalendarMonth] = useState(new Date());

  // Rescheduling modal state
  const [selectedMeetingForReschedule, setSelectedMeetingForReschedule] = useState<Meeting | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [reschedulingSubmitting, setReschedulingSubmitting] = useState(false);
  const [rescheduleError, setRescheduleError] = useState("");

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

    // Check Google Calendar connection status
    const connected = localStorage.getItem('google_calendar_connected') === 'true';
    const email = localStorage.getItem('google_calendar_email') || '';
    const sandbox = localStorage.getItem('google_calendar_is_sandbox') === 'true';
    setIsGoogleConnected(connected);
    setGoogleEmail(email);
    setGoogleIsSandbox(sandbox);
  }, []);

  // Update reschedule date time input when meeting selected
  useEffect(() => {
    if (selectedMeetingForReschedule) {
      try {
        const dt = new Date(selectedMeetingForReschedule.date_time);
        const tzoffset = dt.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dt.getTime() - tzoffset)).toISOString().slice(0, 16);
        setRescheduleDateTime(localISOTime);
      } catch (e) {
        setRescheduleDateTime("");
      }
      setRescheduleError("");
    }
  }, [selectedMeetingForReschedule]);

  const syncMeetingToGoogleCalendar = async (meetingId: string, meetingTitle: string, orgName: string, dateTimeStr: string) => {
    if (!isGoogleConnected) return;

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const startDate = new Date(dateTimeStr);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour default

    const eventPayload = {
      summary: meetingTitle,
      description: `Meeting with organization: ${orgName}. Scheduled via Humppl Growth OS.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone
      }
    };

    if (googleIsSandbox) {
      // Sandbox: Simulate Sync and update localStorage events list
      const mockEventId = `mock_event_${Math.random().toString(36).substring(2, 11)}`;
      
      const mappings = JSON.parse(localStorage.getItem('google_event_mappings') || '{}');
      mappings[meetingId] = mockEventId;
      localStorage.setItem('google_event_mappings', JSON.stringify(mappings));

      const simulatedEvents = JSON.parse(localStorage.getItem('google_simulated_events') || '[]');
      simulatedEvents.push({
        id: mockEventId,
        meetingId,
        title: meetingTitle,
        orgName,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });
      localStorage.setItem('google_simulated_events', JSON.stringify(simulatedEvents));

      toast.success(`Google Calendar (Sandbox): Synced "${meetingTitle}" to ${googleEmail}`);
    } else {
      // Real API Call
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        toast.error("Google Calendar token missing. Please reconnect in Settings.");
        return;
      }

      try {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (response.ok) {
          const data = await response.json();
          const mappings = JSON.parse(localStorage.getItem('google_event_mappings') || '{}');
          mappings[meetingId] = data.id;
          localStorage.setItem('google_event_mappings', JSON.stringify(mappings));
          toast.success(`Google Calendar: Synced "${meetingTitle}" to your calendar!`);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error("Google API Error:", errData);
          toast.error(`Google Calendar sync failed: ${errData.error?.message || response.statusText}`);
        }
      } catch (err) {
        console.error("Google API network error:", err);
        toast.error("Google Calendar sync failed due to network error.");
      }
    }
  };

  const rescheduleMeetingInGoogleCalendar = async (meetingId: string, meetingTitle: string, orgName: string, newDateTimeStr: string) => {
    if (!isGoogleConnected) return;

    const mappings = JSON.parse(localStorage.getItem('google_event_mappings') || '{}');
    const eventId = mappings[meetingId];
    if (!eventId) {
      // If it wasn't synced originally, sync it now
      await syncMeetingToGoogleCalendar(meetingId, meetingTitle, orgName, newDateTimeStr);
      return;
    }

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    const startDate = new Date(newDateTimeStr);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const eventPayload = {
      summary: meetingTitle,
      description: `Meeting with organization: ${orgName}. Rescheduled via Humppl Growth OS.`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone
      }
    };

    if (googleIsSandbox) {
      // Sandbox update
      const simulatedEvents = JSON.parse(localStorage.getItem('google_simulated_events') || '[]');
      const updatedEvents = simulatedEvents.map((ev: any) => {
        if (ev.id === eventId) {
          return { ...ev, start: startDate.toISOString(), end: endDate.toISOString() };
        }
        return ev;
      });
      localStorage.setItem('google_simulated_events', JSON.stringify(updatedEvents));
      toast.success(`Google Calendar (Sandbox): Updated meeting in sandbox calendar.`);
    } else {
      // Real API PATCH
      const token = localStorage.getItem('google_calendar_token');
      if (!token) {
        toast.error("Google Calendar token missing. Please reconnect in Settings.");
        return;
      }

      try {
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(eventPayload)
        });

        if (response.ok) {
          toast.success(`Google Calendar: Synced rescheduled time successfully!`);
        } else {
          const errData = await response.json().catch(() => ({}));
          console.error("Google API error:", errData);
          toast.error(`Google Calendar update failed: ${errData.error?.message || response.statusText}`);
        }
      } catch (err) {
        console.error("Google API network error:", err);
        toast.error("Google Calendar update failed due to network error.");
      }
    }
  };

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
        
        // Google Calendar Sync
        if (isGoogleConnected && syncToCalendar) {
          await syncMeetingToGoogleCalendar(newMeet.id, title, orgObj ? orgObj.name : "N/A", dateTime);
        }

        setIsModalOpen(false);
        setTitle("");
        setDateTime("");
        setStatus("Scheduled");
        toast.success("Meeting scheduled successfully!");
      }
    } catch (err: any) {
      console.error("Failed to create meeting:", err);
      setError("Failed to schedule meeting. Please try again.");
      toast.error("Failed to schedule meeting.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingForReschedule || !rescheduleDateTime) return;
    setReschedulingSubmitting(true);
    setRescheduleError("");
    try {
      const updated = await updateMeetingDateTime(selectedMeetingForReschedule.id, rescheduleDateTime);
      if (updated) {
        const orgName = selectedMeetingForReschedule.organizations?.name || "N/A";
        
        // Google Calendar Update Sync
        if (isGoogleConnected) {
          await rescheduleMeetingInGoogleCalendar(selectedMeetingForReschedule.id, selectedMeetingForReschedule.title, orgName, rescheduleDateTime);
        }

        setMeetings(meetings.map(m => m.id === selectedMeetingForReschedule.id ? { ...m, date_time: rescheduleDateTime } : m).sort((a, b) => new Date(a.date_time).getTime() - new Date(b.date_time).getTime()));
        setSelectedMeetingForReschedule(null);
        toast.success("Meeting rescheduled successfully!");
      }
    } catch (err: any) {
      console.error(err);
      setRescheduleError(err.message || "Failed to reschedule meeting.");
      toast.error("Failed to reschedule meeting.");
    } finally {
      setReschedulingSubmitting(false);
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

  // Helper for Synced Calendar days grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    
    // Add padding days from previous month
    const startPadding = firstDay.getDay();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        isCurrentMonth: false
      });
    }
    
    // Add current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add padding days for next month to complete the grid (multiple of 7)
    const totalDays = days.length;
    const endPadding = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    for (let i = 1; i <= endPadding; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

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

      {/* Google Calendar banner */}
      {isGoogleConnected ? (
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md shadow-blue-500/20">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                Google Calendar Sync Active
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">LIVE</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Synced as <span className="font-semibold text-slate-700">{googleEmail}</span> {googleIsSandbox ? "(Sandbox Mode)" : "(Production Mode)"}. Your meetings automatically replicate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSyncedCalendarModal(true)}
              className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 text-xs font-semibold rounded-xl h-9 px-4 shadow-sm"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-blue-500" /> View Synced Calendar
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-slate-200 text-slate-500 p-3 rounded-xl">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Google Calendar Integration</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Connect your calendar to automatically sync scheduled client meetings.
              </p>
            </div>
          </div>
          <Link href="/settings" className="shrink-0">
            <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl h-9 px-4 border-slate-300 hover:bg-slate-100">
              Set Up Integration
            </Button>
          </Link>
        </div>
      )}

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

              {/* Date Filters */}
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
                      <TableHead className="w-[120px]">Actions</TableHead>
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedMeetingForReschedule(meeting)}
                            className="h-8 text-xs font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                          >
                            Reschedule
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* Total Records bar */}
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

              {/* Sync Toggle */}
              {isGoogleConnected && (
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 p-3.5 rounded-xl">
                  <input 
                    type="checkbox"
                    id="syncToCalendar"
                    checked={syncToCalendar}
                    onChange={(e) => setSyncToCalendar(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500/20 mt-0.5"
                  />
                  <div>
                    <label htmlFor="syncToCalendar" className="text-xs font-bold text-blue-800 cursor-pointer select-none block">
                      Sync to Google Calendar
                    </label>
                    <span className="text-[10px] text-blue-600 block mt-0.5">
                      Will schedule in: <strong>{googleEmail}</strong>
                    </span>
                  </div>
                </div>
              )}

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

      {/* Reschedule Meeting Modal */}
      {selectedMeetingForReschedule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Reschedule Meeting</h2>
              <button onClick={() => setSelectedMeetingForReschedule(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">
                  Rescheduling meeting: <span className="font-semibold text-gray-800">{selectedMeetingForReschedule.title}</span>
                </p>
                {isGoogleConnected && (
                  <div className="text-[10px] text-blue-600 font-semibold bg-blue-50/50 px-2.5 py-1.5 rounded-lg border border-blue-100/30">
                    🔄 Will automatically update the event in Google Calendar ({googleEmail}).
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={rescheduleDateTime}
                  onChange={(e) => setRescheduleDateTime(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              
              {rescheduleError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{rescheduleError}</div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setSelectedMeetingForReschedule(null)} disabled={reschedulingSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={reschedulingSubmitting || !rescheduleDateTime}>
                  {reschedulingSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Rescheduling...
                    </>
                  ) : "Reschedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Synced Calendar Modal */}
      {showSyncedCalendarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-md shadow-blue-500/20">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Google Calendar Visualizer</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Showing synced appointments for <span className="text-blue-600">{googleEmail}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSyncedCalendarModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 p-2 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Controls */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h4 className="font-bold text-slate-800 text-md">
                {visualCalendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h4>
              <div className="flex gap-2">
                <button 
                  onClick={() => setVisualCalendarMonth(new Date(visualCalendarMonth.getFullYear(), visualCalendarMonth.getMonth() - 1, 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setVisualCalendarMonth(new Date())}
                  className="px-3 py-1 border border-slate-200 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Today
                </button>
                <button 
                  onClick={() => setVisualCalendarMonth(new Date(visualCalendarMonth.getFullYear(), visualCalendarMonth.getMonth() + 1, 1))}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar Monthly Grid */}
            <div className="p-6 bg-slate-50/50">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <span key={d} className="text-xs font-bold text-slate-400 py-2 uppercase tracking-wider">
                    {d}
                  </span>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1.5 bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200/60">
                {getDaysInMonth(visualCalendarMonth).map((day, idx) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  
                  // Filter meetings that occur on this cell date
                  const cellMeetings = meetings.filter(m => {
                    const mDate = new Date(m.date_time);
                    return mDate.getDate() === day.date.getDate() &&
                           mDate.getMonth() === day.date.getMonth() &&
                           mDate.getFullYear() === day.date.getFullYear();
                  });

                  // Include mock sandbox events
                  const sandboxEvents = JSON.parse(localStorage.getItem('google_simulated_events') || '[]');
                  const cellSandboxEvents = sandboxEvents.filter((se: any) => {
                    const seDate = new Date(se.start);
                    return seDate.getDate() === day.date.getDate() &&
                           seDate.getMonth() === day.date.getMonth() &&
                           seDate.getFullYear() === day.date.getFullYear();
                  });

                  // Merge unique events
                  const allEvents = [...cellMeetings.map(m => ({
                    id: m.id,
                    title: m.title,
                    time: new Date(m.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    org: m.organizations?.name || 'N/A',
                    isMock: false
                  }))];

                  cellSandboxEvents.forEach((se: any) => {
                    if (!allEvents.some(ae => ae.title === se.title)) {
                      allEvents.push({
                        id: se.id,
                        title: se.title,
                        time: new Date(se.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        org: se.orgName,
                        isMock: true
                      });
                    }
                  });

                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[90px] p-2 bg-white rounded-xl flex flex-col justify-between border border-slate-100 ${
                        day.isCurrentMonth ? 'text-slate-800' : 'text-slate-300 opacity-60 bg-slate-50/20'
                      } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-blue-600 text-white' : ''
                        }`}>
                          {day.date.getDate()}
                        </span>
                      </div>
                      <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[64px] scrollbar-thin">
                        {allEvents.map((evt, eIdx) => (
                          <div 
                            key={eIdx} 
                            title={`${evt.title} - ${evt.org} (${evt.time})`}
                            className={`text-[9px] font-bold p-1 rounded-md truncate ${
                              evt.isMock 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            <span className="opacity-80 mr-0.5">{evt.time}</span> {evt.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-blue-600"></span> Database Meetings
                </span>
                {googleIsSandbox && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-amber-600"></span> Sandbox Test Events
                  </span>
                )}
              </div>
              <p>Simulating live Google Calendar v3 REST calls</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
