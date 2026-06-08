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
  Clock, 
  AlertCircle,
  X,
  MessageSquare,
  User,
  CheckCircle2
} from "lucide-react";
import { 
  getTicketDetail, 
  updateTicketStatus, 
  getTicketComments, 
  addTicketComment 
} from "@/actions";
import { toast } from "@/components/ui/Toast";

interface Ticket {
  id: string;
  created_at: string;
  title: string;
  description?: string;
  organization_id: number;
  contact_id?: number | null;
  owner?: string;
  priority: 'High' | 'Medium' | 'Low';
  category: 'Request' | 'Issue' | 'Escalation' | 'Risk';
  status: 'Open' | 'In Progress' | 'Pending' | 'Resolved';
  sla_target: string;
  resolution_notes?: string;
  organizations?: {
    name: string;
  } | null;
}

interface Comment {
  id: string;
  created_at: string;
  ticket_id: string;
  content: string;
  created_by: string;
}

const STATUSES = ["Open", "In Progress", "Pending", "Resolved"];

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status update / resolution state
  const [newStatus, setNewStatus] = useState<any>("Open");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New Comment state
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ticketData = await getTicketDetail(id);
      if (!ticketData) {
        setError("Ticket not found.");
        return;
      }
      setTicket(ticketData);
      setNewStatus(ticketData.status);
      setResolutionNotes(ticketData.resolution_notes || "");

      const commentsData = await getTicketComments(id);
      setComments(commentsData);
    } catch (err: any) {
      console.error(err);
      setError("Error loading ticket details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: 'Open' | 'In Progress' | 'Pending' | 'Resolved') => {
    if (status === 'Resolved') {
      setShowResolveModal(true);
      return;
    }
    setUpdatingStatus(true);
    try {
      const updated = await updateTicketStatus(id, status);
      if (updated) {
        setTicket(updated as any);
        toast.success(`Ticket status marked as ${status}`);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateTicketStatus(id, 'Resolved', resolutionNotes);
      if (updated) {
        setTicket(updated as any);
        toast.success("Ticket resolved successfully!");
        setShowResolveModal(false);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to resolve ticket.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = await addTicketComment(id, commentContent, "humppllab@humppl.com");
      if (newComment) {
        setComments([...comments, newComment]);
        setCommentContent("");
        toast.success("Comment added.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const getSlaBadge = (target: string, status: string) => {
    if (status === 'Resolved') return <Badge className="bg-slate-100 text-slate-700">Resolved</Badge>;
    const targetDate = new Date(target);
    const now = new Date();
    const isBreached = targetDate < now;
    if (isBreached) {
      return (
        <Badge className="bg-rose-100 text-rose-700 flex items-center gap-1 font-bold animate-pulse">
          <AlertCircle className="h-3 w-3" /> SLA Breached
        </Badge>
      );
    }
    const diffMs = targetDate.getTime() - now.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    return (
      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 flex items-center gap-1">
        <Clock className="h-3 w-3" /> {diffHours}h left
      </Badge>
    );
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
        <p className="text-sm text-gray-500 font-medium">Loading ticket...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/tickets" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Helpdesk
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
          <Link href="/tickets" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Helpdesk
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <Badge variant="secondary">{ticket.status}</Badge>
            {getSlaBadge(ticket.sla_target, ticket.status)}
          </div>
          <p className="text-sm text-gray-500 font-semibold">
            Client Company: {ticket.organizations?.name || "Independent"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select 
            value={ticket.status} 
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
            disabled={updatingStatus}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detail and resolution */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Ticket Properties</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Category</span>
                <span className="font-semibold text-gray-800">{ticket.category}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Priority Level</span>
                <span className="font-semibold text-gray-800">{ticket.priority}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Assigned Support</span>
                <span className="font-semibold text-gray-800">{ticket.owner || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">SLA Target Date</span>
                <span className="font-semibold text-gray-800">{formatDateTime(ticket.sla_target)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Opened On</span>
                <span className="font-semibold text-gray-800">{formatDateTime(ticket.created_at)}</span>
              </div>
            </CardContent>
          </Card>

          {ticket.status === 'Resolved' && (
            <Card className="border-emerald-200 bg-emerald-50/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-800 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Resolution Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-emerald-900 leading-relaxed font-medium">
                {ticket.resolution_notes || "No resolution details logged."}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Description & Discussion Thread */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Issue Description</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-700 whitespace-pre-line leading-relaxed font-medium">
              {ticket.description || "No description provided."}
            </CardContent>
          </Card>

          {/* Discussion Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400" /> Internal Notes & Discussions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Thread list */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No internal remarks posted yet.</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-900 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-gray-400" /> {c.created_by}
                        </span>
                        <span className="text-gray-400">{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Remark Form */}
              <form onSubmit={handleAddComment} className="border-t pt-4 flex gap-2">
                <input 
                  type="text" required value={commentContent} onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Type an internal note or response remark..." 
                  className="flex-1 px-3 py-2 border rounded-xl text-sm"
                  disabled={submittingComment}
                />
                <Button type="submit" disabled={submittingComment || !commentContent.trim()}>
                  {submittingComment ? "Posting..." : "Post Remark"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Resolve Ticket Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Resolve Support Ticket</h2>
              <button onClick={() => setShowResolveModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Resolution Details *</label>
                <textarea 
                  required value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Elaborate on how the issue was resolved or what steps were taken to conclude this request..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowResolveModal(false)} disabled={updatingStatus}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updatingStatus || !resolutionNotes.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Mark Resolved
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
