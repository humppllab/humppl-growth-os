'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, Calendar as CalendarIcon, X, Loader2 } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your calendar and client appointments.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
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
      ) : meetings.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No meetings scheduled. Click "Schedule Meeting" to create one.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Meeting Title</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {meetings.map((meeting) => (
              <TableRow key={meeting.id}>
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
