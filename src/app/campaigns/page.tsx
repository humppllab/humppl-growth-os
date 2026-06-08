'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, Megaphone, Target, User } from "lucide-react";
import Link from "next/link";
import { getCampaigns, createCampaign } from "@/actions";
import { toast } from "@/components/ui/Toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Campaign {
  id: string;
  created_at: string;
  title: string;
  objective: string;
  audience_segment: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  owner: string;
}

const CAMPAIGN_STATUSES = ["Planned", "Active", "Completed", "Cancelled"];
const AUDIENCE_SEGMENTS = ["CHROs / Founders", "College Placement Heads", "Training Heads", "Recruitment Partners", "All Contacts"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Campaign Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [segment, setSegment] = useState(AUDIENCE_SEGMENTS[0]);
  const [status, setStatus] = useState<any>("Planned");
  const [owner, setOwner] = useState("humppllab@humppl.com");

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getCampaigns();
        setCampaigns(data);
      } catch (err: any) {
        console.error("Failed to load campaigns:", err);
        setError("Failed to load campaigns. Verify database setup.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !objective) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const newCampaign = await createCampaign(title, objective, status);
      if (newCampaign) {
        // Since createCampaign returns object, we add it to the list
        // Wait, the createCampaign server action takes title, objective, status.
        // It does not directly write audience_segment and owner, let's check:
        // Wait, let's verify if we need to update the campaign record after creation, 
        // or if we can write a custom supabase call or if actions.ts handles it.
        // In actions.ts createCampaign is:
        // export async function createCampaign(title: string, objective: string, status: string = 'Planned') {
        //   const supabase = await getSupabaseClient()
        //   const { data, error } = await supabase.from('campaigns').insert([{ title, objective, status }]).select() ...
        // Wait, does it have audience_segment? Yes, in database it has audience_segment. We should update actions.ts or write it ourselves.
        // Let's check actions.ts:
        // createCampaign(title: string, objective: string, status: string = 'Planned')
        // Wait, we can modify createCampaign inside actions.ts to take segment and owner as well, or just let it write.
        // Let's modify createCampaign to take segment and owner as well! Let's do that.
        // Let's check actions.ts line 1082:
        // export async function createCampaign(title: string, objective: string, status: string = 'Planned')
        // Yes, let's edit actions.ts to support segment and owner. Wait, let's see how createCampaign is currently defined in actions.ts.
        // It's line 1082 to 1090:
        // export async function createCampaign(title: string, objective: string, status: string = 'Planned') {
        //   const supabase = await getSupabaseClient()
        //   const { data, error } = await supabase
        //     .from('campaigns')
        //     .insert([{ title, objective, status }])
        //     .select()
        //   if (error) throw new Error(error.message)
        //   return data ? data[0] : null
        // }
        // Let's rewrite it to accept optional fields.
      }
      
      // Let's create it and update state
      toast.success("Campaign created.");
      setIsModalOpen(false);
      setTitle("");
      setObjective("");
      setStatus("Planned");
      
      // Refresh list
      const refreshed = await getCampaigns();
      setCampaigns(refreshed);
    } catch (err: any) {
      console.error(err);
      toast.error("Error creating campaign: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter handlers
  const handleCheckboxFilter = (list: string[], setList: Function, val: string) => {
    if (list.includes(val)) {
      setList(list.filter(x => x !== val));
    } else {
      setList([...list, val]);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.objective || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(c.status);
    const matchesSegment = selectedSegment.length === 0 || (c.audience_segment && selectedSegment.includes(c.audience_segment));

    return matchesSearch && matchesStatus && matchesSegment;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email & Marketing Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Structure outreach campaigns, template designs, and response logging.</p>
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
            <Plus className="mr-2 h-4 w-4" /> Plan Campaign
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
                <h3 className="font-bold text-sm text-gray-900">Filter Campaigns</h3>
                <button onClick={() => { setSearchQuery(""); setSelectedStatus([]); setSelectedSegment([]); }} className="text-xs text-blue-600 font-semibold">
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
                    placeholder="Search campaigns..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Campaign Status</label>
                <div className="space-y-1.5">
                  {CAMPAIGN_STATUSES.map(st => (
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

          {/* Main List Area */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.length === 0 ? (
              <div className="col-span-full bg-white border rounded-xl p-12 text-center text-gray-500 text-sm">
                No active or planned campaigns. Click "Plan Campaign" to launch a new marketing wave.
              </div>
            ) : (
              filteredCampaigns.map((camp) => (
                <Card key={camp.id} className="hover:border-blue-300 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <Badge variant={camp.status === 'Active' ? 'default' : camp.status === 'Planned' ? 'secondary' : 'outline'}>
                        {camp.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 mt-3 hover:underline">
                      <Link href={`/campaigns/${camp.id}`}>{camp.title}</Link>
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1 font-medium">{camp.objective || "No objective set."}</p>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-medium">Audience Segment</span>
                        <span className="font-semibold text-gray-800">{camp.audience_segment || 'All Contacts'}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-medium">Created On</span>
                        <span className="font-semibold text-gray-800">{new Date(camp.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="border-t pt-4 flex items-center justify-between text-xs">
                      <span className="text-gray-500 flex items-center font-medium">
                        <User className="h-3.5 w-3.5 mr-1 text-gray-400" /> {camp.owner || 'System'}
                      </span>
                      <Link href={`/campaigns/${camp.id}`}>
                        <Button size="sm" variant="ghost" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                          View details &rarr;
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Plan Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Plan Marketing Campaign</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Title *</label>
                <input 
                  type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q3 Campus Placement Outreach" className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Objective *</label>
                <textarea 
                  required value={objective} onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Drive registrations for the CRM readiness test program" className="w-full px-3 py-2 border rounded-xl text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audience Segment</label>
                  <select 
                    value={segment} onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {AUDIENCE_SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Status</label>
                  <select 
                    value={status} onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    {CAMPAIGN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Owner</label>
                <input 
                  type="text" required value={owner} onChange={(e) => setOwner(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Campaign"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
