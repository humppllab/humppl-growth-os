'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, AlertCircle, Clock, LifeBuoy } from "lucide-react";
import Link from "next/link";
import { getTickets, createTicket, getOrganizations } from "@/actions";
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

const CATEGORIES = ["Request", "Issue", "Escalation", "Risk"];
const PRIORITIES = ["High", "Medium", "Low"];
const STATUSES = ["Open", "In Progress", "Pending", "Resolved"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [orgId, setOrgId] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [priority, setPriority] = useState(PRIORITIES[1]);
  const [description, setDescription] = useState("");

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [ticketsData, orgsData] = await Promise.all([
          getTickets(),
          getOrganizations()
        ]);
        setTickets(ticketsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrgId(orgsData[0].id.toString());
        }
      } catch (err: any) {
        console.error("Failed to load tickets:", err);
        setError("Failed to load helpdesk tickets. Check database setup.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !orgId || !description) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const newTicket = await createTicket(
        title,
        parseInt(orgId),
        category,
        priority,
        description
      );
      if (newTicket) {
        toast.success("Support ticket opened.");
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setCategory(CATEGORIES[0]);
        setPriority(PRIORITIES[1]);
        
        // Refresh list
        const refreshed = await getTickets();
        setTickets(refreshed);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating ticket: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckboxFilter = (list: string[], setList: Function, val: string) => {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = selectedPriorities.length === 0 || selectedPriorities.includes(t.priority);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(t.status);

    return matchesSearch && matchesPriority && matchesStatus;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support & Client Success Desk</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client issues, SLA timers, and escalation timelines.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Open Ticket
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
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Tickets</h3>
                <button onClick={() => { setSearchQuery(""); setSelectedPriorities([]); setSelectedStatuses([]); }} className="text-xs text-blue-600 font-semibold">
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
                    placeholder="Search tickets..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Priority</label>
                <div className="space-y-1.5">
                  {PRIORITIES.map(p => (
                    <label key={p} className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedPriorities.includes(p)}
                        onChange={() => handleCheckboxFilter(selectedPriorities, setSelectedPriorities, p)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Status</label>
                <div className="space-y-1.5">
                  {STATUSES.map(s => (
                    <label key={s} className="flex items-center text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedStatuses.includes(s)}
                        onChange={() => handleCheckboxFilter(selectedStatuses, setSelectedStatuses, s)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Table area */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No active helpdesk tickets. Good job!
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Title</TableHead>
                      <TableHead>Client Organization</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>SLA Status</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Owner</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((t) => (
                      <TableRow key={t.id} className={t.priority === 'High' && t.status !== 'Resolved' ? 'bg-red-50/20' : ''}>
                        <TableCell className="font-medium text-blue-600">
                          <Link href={`/tickets/${t.id}`} className="hover:underline">
                            {t.title}
                          </Link>
                        </TableCell>
                        <TableCell>{t.organizations?.name || '--'}</TableCell>
                        <TableCell className="text-xs text-gray-500 font-semibold">{t.category}</TableCell>
                        <TableCell>
                          <Badge variant={t.priority === 'High' ? 'default' : t.priority === 'Medium' ? 'secondary' : 'outline'}>
                            {t.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{getSlaBadge(t.sla_target, t.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{t.status}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{t.owner || 'System'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>Total Tickets: {filteredTickets.length}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Open Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Open Support Ticket</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Ticket Title *</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dashboard metrics out of sync" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Client Company *</label>
                <select 
                  value={orgId} onChange={(e) => setOrgId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  {organizations.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select 
                    value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority (SLA triggers)</label>
                  <select 
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p}>{p} ({p === 'High' ? '24h' : p === 'Medium' ? '48h' : '72h'} SLA)</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
                <textarea 
                  required value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Elaborate on the issue, error messages or client requests..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Opening..." : "Open Ticket"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
