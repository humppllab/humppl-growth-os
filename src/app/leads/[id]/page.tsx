'use client'

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  ArrowLeft, 
  Loader2, 
  Plus, 
  Trash2, 
  Building2, 
  User, 
  Briefcase, 
  Clock, 
  FileText, 
  Calendar,
  AlertCircle,
  Phone,
  Mail,
  Edit2
} from "lucide-react";
import { 
  getLeadDetail, 
  updateLead, 
  getNotes, 
  createNote, 
  deleteNote, 
  getActivityTimeline 
} from "@/actions";
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

interface Note {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  title: string;
  description: string;
  type: string;
  created_at: string;
}

const SOURCES = ["Website", "LinkedIn Outbound", "Referral", "Campus Event", "Direct Email", "Partner Referral", "Other"];
const QUALITY_LEVELS = ["High", "Medium", "Low"];
const STATUSES = ["Raw", "Contacted", "Qualified", "Nurture", "Disqualified"];

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const leadIdNum = parseInt(id);

  const [lead, setLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "timeline">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<Lead>>({});
  const [updating, setUpdating] = useState(false);

  // New Note State
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadDetail(leadIdNum);
      if (!data) {
        setError("Lead not found.");
        return;
      }
      setLead(data);
      setForm(data);

      // Fetch notes and activity logs for this lead
      const [notesData, logsData] = await Promise.all([
        getNotes(undefined, undefined, data.id), // Fetch notes linked to contact_id or we can pass leadId if supported, wait, notes table has contact_id. Since we don't have a direct lead_id column on notes (it has organization_id, opportunity_id, contact_id), we can fetch using organizationName mapping or just generic logs. Let's see: notes table has organization_id, opportunity_id, contact_id. Let's pass organization_id if it exists.
        getActivityTimeline(undefined, undefined, undefined) // generic timeline
      ]);
      setNotes(notesData);
      setTimeline(logsData.filter((log: any) => log.description.includes(data.first_name) || log.description.includes(data.organization_name)));
    } catch (err: any) {
      console.error(err);
      setError("Error loading lead details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const updated = await updateLead(leadIdNum, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        mobile: form.mobile,
        job_title: form.job_title,
        organization_name: form.organization_name,
        source: form.source,
        lead_quality: form.lead_quality,
        priority_score: form.priority_score,
        owner: form.owner,
        qualification_status: form.qualification_status
      });
      if (updated) {
        setLead(updated);
        setIsEditing(false);
        toast.success("Lead details updated.");
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update lead: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    try {
      // Create note with created_by as lead owner or current user
      const newNote = await createNote(
        noteContent, 
        undefined, 
        undefined, 
        undefined, 
        "humppllab@humppl.com"
      );
      if (newNote) {
        setNotes([newNote, ...notes]);
        setNoteContent("");
        toast.success("Note added.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      toast.success("Note deleted.");
    } catch (err) {
      console.error(err);
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading details...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/leads" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-2">
          <Link href="/leads" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Leads
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{lead.first_name} {lead.last_name}</h1>
            <Badge variant="secondary">{lead.qualification_status}</Badge>
            {lead.converted && <Badge className="bg-emerald-100 text-emerald-800">Converted</Badge>}
          </div>
          <p className="text-sm text-gray-500 flex items-center">
            <Building2 className="h-4 w-4 mr-1 text-gray-400" />
            {lead.organization_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
            <Edit2 className="h-4 w-4 mr-2" /> {isEditing ? "Cancel Edit" : "Edit Lead"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          <button 
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab("notes")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'notes' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Notes ({notes.length})
          </button>
          <button 
            onClick={() => setActiveTab("timeline")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'timeline' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Activity Timeline ({timeline.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Lead Parameters</CardTitle>
                <CardDescription>Modify lead fields backing this prospect.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                      <input 
                        type="text" required value={form.first_name || ""} 
                        onChange={(e) => setForm({...form, first_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                      <input 
                        type="text" required value={form.last_name || ""} 
                        onChange={(e) => setForm({...form, last_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                      <input 
                        type="email" required value={form.email || ""} 
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Organization Name</label>
                      <input 
                        type="text" required value={form.organization_name || ""} 
                        onChange={(e) => setForm({...form, organization_name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title</label>
                      <input 
                        type="text" value={form.job_title || ""} 
                        onChange={(e) => setForm({...form, job_title: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                      <input 
                        type="text" value={form.phone || ""} 
                        onChange={(e) => setForm({...form, phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mobile</label>
                      <input 
                        type="text" value={form.mobile || ""} 
                        onChange={(e) => setForm({...form, mobile: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                      <select 
                        value={form.source || ""} onChange={(e) => setForm({...form, source: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      >
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Quality</label>
                      <select 
                        value={form.lead_quality || "Medium"} onChange={(e) => setForm({...form, lead_quality: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      >
                        {QUALITY_LEVELS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                      <select 
                        value={form.qualification_status || "Raw"} onChange={(e) => setForm({...form, qualification_status: e.target.value as any})}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Priority Score (0-100)</label>
                      <input 
                        type="number" value={form.priority_score || 0} 
                        onChange={(e) => setForm({...form, priority_score: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Lead Owner</label>
                      <input 
                        type="text" value={form.owner || ""} 
                        onChange={(e) => setForm({...form, owner: e.target.value})}
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={updating}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updating}>
                      {updating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="grid gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact & Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-gray-400 mt-1" />
                        <div>
                          <span className="text-xs text-gray-500 font-medium block">Email Address</span>
                          <span className="text-sm font-semibold text-gray-900">{lead.email}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-gray-400 mt-1" />
                        <div>
                          <span className="text-xs text-gray-500 font-medium block">Phone / Mobile</span>
                          <span className="text-sm font-semibold text-gray-900">{lead.mobile || lead.phone || '--'}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Job Title / Designation</span>
                        <span className="text-sm font-semibold text-gray-900">{lead.job_title || '--'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Lead Quality</span>
                        <Badge variant={lead.lead_quality === 'High' ? 'default' : lead.lead_quality === 'Medium' ? 'secondary' : 'outline'}>
                          {lead.lead_quality || 'Medium'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Lead Source</span>
                        <span className="text-sm font-semibold text-gray-900">{lead.source || '--'}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Priority Score</span>
                        <span className="text-sm font-semibold text-gray-900">{lead.priority_score || 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Owner</span>
                        <span className="text-sm font-semibold text-gray-900 flex items-center mt-1">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          {lead.owner}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium block">Date Created</span>
                        <span className="text-sm font-semibold text-gray-900 flex items-center mt-1">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDateTime(lead.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Add Lead Note</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddNote} className="space-y-3">
                        <textarea 
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Type details of outreach call or emails..."
                          required rows={3}
                          className="w-full px-4 py-2 border rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={submittingNote || !noteContent.trim()}>
                            {submittingNote ? "Adding..." : "Add Note"}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {notes.length === 0 ? (
                      <div className="bg-white border rounded-xl p-8 text-center">
                        <p className="text-gray-500 text-sm">No notes added yet for this lead.</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <Card key={note.id} className="shadow-sm">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold font-sans">
                                  {note.created_by?.slice(0, 2).toUpperCase() || "SU"}
                                </div>
                                <div>
                                  <span className="text-sm font-semibold text-gray-900">{note.created_by}</span>
                                  <span className="text-xs text-gray-400 ml-2">{formatDateTime(note.created_at)}</span>
                                </div>
                              </div>
                              <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{note.content}</p>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Audit Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timeline.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-8">No logged activities for this lead.</p>
                    ) : (
                      <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6">
                        {timeline.map((act) => (
                          <div key={act.id} className="relative">
                            <div className="absolute -left-[31px] top-1 bg-blue-100 border-2 border-white rounded-full p-1.5 flex items-center justify-center">
                              <Clock className="h-3 w-3 text-blue-600" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{act.title}</h4>
                              <p className="text-xs text-gray-500">{act.description}</p>
                              <span className="text-[10px] text-gray-400 font-medium block">
                                {formatDateTime(act.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
