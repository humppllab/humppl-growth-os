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
  AlertCircle
} from "lucide-react";
import { 
  getOpportunityDetail, 
  getNotes, 
  createNote, 
  deleteNote, 
  getActivityTimeline
} from "@/actions";
import { formatRupees } from "@/lib/utils";

interface OpportunityDetail {
  id: string;
  name: string;
  organization_id: number;
  type: string;
  stage: string;
  value: number;
  owner: string;
  created_at: string;
  organizations?: {
    id: number;
    name: string;
    industry: string;
    website_url: string;
  } | null;
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

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [opp, setOpp] = useState<OpportunityDetail | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "timeline">("overview");
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const oppData = await getOpportunityDetail(id);
      if (!oppData) {
        setError("Opportunity not found.");
        return;
      }
      setOpp(oppData);

      const [notesData, logsData] = await Promise.all([
        getNotes(id),
        getActivityTimeline(id)
      ]);
      // merge any locally imported notes saved by Import Notes page
      try {
        const stored = localStorage.getItem('imported_notes')
        if (stored) {
          const imported = JSON.parse(stored) as Note[]
          setNotes([...imported, ...notesData])
        } else {
          setNotes(notesData)
        }
      } catch (e) {
        setNotes(notesData)
      }
      setTimeline(logsData);
    } catch (err: any) {
      console.error("Failed to load details:", err);
      setError("Error loading opportunity details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem('imported_notes')
      if (!stored) return
      try {
        const imported = JSON.parse(stored) as Note[]
        setNotes(prev => [...imported, ...prev])
      } catch (e) {}
    }
    window.addEventListener('imported-notes-updated', handler)
    return () => window.removeEventListener('imported-notes-updated', handler)
  }, [])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSubmittingNote(true);
    try {
      const newNote = await createNote(noteContent, id, opp?.organization_id, undefined, "Sumit");
      if (newNote) {
        setNotes([newNote, ...notes]);
        setNoteContent("");
        // Reload timeline to show note added event
        const logsData = await getActivityTimeline(id);
        setTimeline(logsData);
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
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

  if (error || !opp) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/opportunities" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Opportunities
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
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{opp.name}</h1>
            <Badge variant="secondary">{opp.stage}</Badge>
          </div>
          <p className="text-sm text-gray-500 flex items-center">
            <Building2 className="h-4 w-4 mr-1 text-gray-400" />
            {opp.organizations?.name || "Independent"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-gray-500 block font-medium">Deal Value</span>
            <span className="text-2xl font-bold text-blue-600">{formatRupees(opp.value)}</span>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
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
          {activeTab === "overview" && (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Opportunity Metadata</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Opportunity Type</span>
                    <span className="text-sm font-semibold text-gray-900">{opp.type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Pipeline Stage</span>
                    <span className="text-sm font-semibold text-gray-900">{opp.stage}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Owner</span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center mt-1">
                      <User className="h-4 w-4 mr-1 text-gray-400" />
                      {opp.owner}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 font-medium block">Date Created</span>
                    <span className="text-sm font-semibold text-gray-900 flex items-center mt-1">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDateTime(opp.created_at)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {opp.organizations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Associated Company Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 font-medium block">Company Name</span>
                      <span className="text-sm font-semibold text-gray-900">{opp.organizations.name}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium block">Industry</span>
                      <span className="text-sm font-semibold text-gray-900">{opp.organizations.industry || '--'}</span>
                    </div>
                    {opp.organizations.website_url && (
                      <div className="col-span-1 sm:col-span-2">
                        <span className="text-xs text-gray-500 font-medium block">Website</span>
                        <a 
                          href={opp.organizations.website_url.startsWith('http') ? opp.organizations.website_url : `https://${opp.organizations.website_url}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                          {opp.organizations.website_url}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-6">
              {/* Add Note Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add CRM Note</CardTitle>
                  <CardDescription>Record important meeting logs or discussion notes for this deal.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddNote} className="space-y-3">
                    <textarea 
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Type details of discussions, requirements or next actions..."
                      required
                      rows={3}
                      className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={submittingNote || !noteContent.trim()}>
                        {submittingNote ? (
                          <>
                            <Loader2 className="animate-spin mr-2 h-4 w-4" /> Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-1 h-4 w-4" /> Add Note
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Notes List */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <div className="bg-white border rounded-xl p-8 text-center">
                    <p className="text-gray-500 text-sm">No notes added yet for this opportunity.</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <Card key={note.id} className="hover:border-gray-300 transition-colors shadow-sm">
                      <CardContent className="p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                              {note.created_by?.slice(0, 2).toUpperCase() || "SU"}
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-gray-900">{note.created_by}</span>
                              <span className="text-xs text-gray-400 ml-2">{formatDateTime(note.created_at)}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
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
                <CardTitle className="text-lg">Audit Activity Timeline</CardTitle>
                <CardDescription>Track state transitions, client interactions and notes creation history.</CardDescription>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No logged activities.</p>
                ) : (
                  <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6">
                    {timeline.map((act) => (
                      <div key={act.id} className="relative">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[31px] top-1 bg-blue-100 border-2 border-white rounded-full p-1.5 flex items-center justify-center shrink-0">
                          <Clock className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{act.title}</h4>
                          {act.description && (
                            <p className="text-xs text-gray-500">{act.description}</p>
                          )}
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
        </div>
      </div>
    </div>
  );
}
