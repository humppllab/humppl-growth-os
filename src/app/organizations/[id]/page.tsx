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
  Building2, 
  Users, 
  Briefcase, 
  Clock, 
  Calendar,
  AlertCircle,
  LifeBuoy,
  UserCheck,
  CheckCircle,
  FileText,
  HelpCircle,
  Activity
} from "lucide-react";
import { getOrganizationDetail, getActivityTimeline } from "@/actions";
import { formatRupees } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
}

interface Opportunity {
  id: string;
  name: string;
  type: string;
  stage: string;
  value: number;
  owner: string;
}

interface OnboardingChecklist {
  id: string;
  project: string;
  progress: number;
  delivery_owner?: string;
}

interface Ticket {
  id: string;
  title: string;
  priority: string;
  status: string;
  owner?: string;
}

interface OrganizationDetail {
  id: number;
  created_at: string;
  name: string;
  industry?: string;
  website_url?: string;
  segment?: string;
  priority?: string;
  owner?: string;
  status?: string;
  contacts?: Contact[];
  opportunities?: Opportunity[];
  onboarding_checklists?: OnboardingChecklist[];
  tickets?: Ticket[];
}

interface ActivityLog {
  id: string;
  title: string;
  description: string;
  type: string;
  created_at: string;
}

export default function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const orgIdNum = parseInt(id);

  const [org, setOrg] = useState<OrganizationDetail | null>(null);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "opportunities" | "onboarding" | "tickets" | "timeline">("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const orgData = await getOrganizationDetail(orgIdNum);
      if (!orgData) {
        setError("Organization not found.");
        return;
      }
      setOrg(orgData);

      const logsData = await getActivityTimeline(undefined, orgIdNum, undefined);
      setTimeline(logsData);
    } catch (err: any) {
      console.error(err);
      setError("Error loading organization details. Try again.");
    } finally {
      setLoading(false);
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
        <p className="text-sm text-gray-500 font-medium">Loading organization...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/organizations" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
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
          <Link href="/organizations" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Organizations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
            {org.status && <Badge variant="secondary">{org.status}</Badge>}
            {org.segment && <Badge variant="outline">{org.segment}</Badge>}
          </div>
          {org.website_url && (
            <a 
              href={org.website_url.startsWith('http') ? org.website_url : `https://${org.website_url}`}
              target="_blank" rel="noopener noreferrer" 
              className="text-sm text-blue-600 hover:underline font-semibold block"
            >
              {org.website_url}
            </a>
          )}
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
            onClick={() => setActiveTab("contacts")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'contacts' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Contacts ({org.contacts?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab("opportunities")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'opportunities' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Opportunities ({org.opportunities?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab("onboarding")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'onboarding' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Onboarding ({org.onboarding_checklists?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab("tickets")}
            className={`w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === 'tickets' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm border border-blue-100/50' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            Tickets ({org.tickets?.length || 0})
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
            <Card>
              <CardHeader><CardTitle>Company Overview</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-6 text-sm font-medium">
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Company Name</span>
                  <span className="text-gray-900 font-semibold">{org.name}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Industry Sector</span>
                  <span className="text-gray-900 font-semibold">{org.industry || '--'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Client Segment</span>
                  <span className="text-gray-900 font-semibold">{org.segment || '--'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Priority Tier</span>
                  <span className="text-gray-900 font-semibold">{org.priority || '--'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Account Owner</span>
                  <span className="text-gray-900 font-semibold">{org.owner || 'humppllab@humppl.com'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block font-bold">Created On</span>
                  <span className="text-gray-900 font-semibold">{formatDateTime(org.created_at)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "contacts" && (
            <Card>
              <CardHeader><CardTitle>Associated Contacts</CardTitle></CardHeader>
              <CardContent>
                {!org.contacts || org.contacts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 font-medium">No contacts linked to this company.</p>
                ) : (
                  <div className="space-y-4">
                    {org.contacts.map(c => (
                      <div key={c.id} className="flex justify-between items-center border p-4 rounded-xl bg-slate-50/50 shadow-sm hover:border-blue-300 transition-colors">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{c.first_name} {c.last_name}</h4>
                          <span className="text-xs text-gray-400 font-medium">{c.job_title || 'No Job Title'}</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-600">{c.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "opportunities" && (
            <Card>
              <CardHeader><CardTitle>Opportunities & Deals</CardTitle></CardHeader>
              <CardContent>
                {!org.opportunities || org.opportunities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 font-medium">No active opportunities for this company.</p>
                ) : (
                  <div className="space-y-4">
                    {org.opportunities.map(o => (
                      <div key={o.id} className="flex justify-between items-center border p-4 rounded-xl bg-slate-50/50 shadow-sm hover:border-blue-300 transition-all">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">
                            <Link href={`/opportunities/${o.id}`} className="hover:underline text-blue-600">
                              {o.name}
                            </Link>
                          </h4>
                          <span className="text-xs text-gray-400 font-semibold">{o.type}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-800 block">{formatRupees(o.value)}</span>
                          <Badge variant="outline">{o.stage}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "onboarding" && (
            <Card>
              <CardHeader><CardTitle>Client Onboarding Checklists</CardTitle></CardHeader>
              <CardContent>
                {!org.onboarding_checklists || org.onboarding_checklists.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 font-medium">No onboarding checklists mapped.</p>
                ) : (
                  <div className="space-y-4">
                    {org.onboarding_checklists.map(ob => (
                      <div key={ob.id} className="flex justify-between items-center border p-4 rounded-xl bg-slate-50/50 shadow-sm">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">{ob.project}</h4>
                          <span className="text-xs text-gray-400 font-semibold">Owner: {ob.delivery_owner || 'Delivery Lead'}</span>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">{ob.progress}% Complete</span>
                          <div className="w-24 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-1.5" style={{ width: `${ob.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "tickets" && (
            <Card>
              <CardHeader><CardTitle>Support & Success Tickets</CardTitle></CardHeader>
              <CardContent>
                {!org.tickets || org.tickets.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 font-medium">No support tickets for this company.</p>
                ) : (
                  <div className="space-y-4">
                    {org.tickets.map(t => (
                      <div key={t.id} className="flex justify-between items-center border p-4 rounded-xl bg-slate-50/50 shadow-sm hover:border-blue-300 transition-all">
                        <div>
                          <h4 className="font-bold text-gray-900 text-sm">
                            <Link href={`/tickets/${t.id}`} className="hover:underline text-blue-600">
                              {t.title}
                            </Link>
                          </h4>
                          <span className="text-xs text-gray-400 font-semibold">Priority: {t.priority}</span>
                        </div>
                        <div className="text-right">
                          <Badge variant={t.status === 'Resolved' ? 'outline' : 'default'}>{t.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "timeline" && (
            <Card>
              <CardHeader><CardTitle>Activity Log history</CardTitle></CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 font-medium">No activities recorded for this organization.</p>
                ) : (
                  <div className="relative border-l-2 border-gray-200 ml-4 pl-6 space-y-6">
                    {timeline.map((act) => (
                      <div key={act.id} className="relative">
                        <div className="absolute -left-[31px] top-1 bg-blue-100 border-2 border-white rounded-full p-1.5 flex items-center justify-center shrink-0">
                          <Activity className="h-3 w-3 text-blue-600" />
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
        </div>
      </div>
    </div>
  );
}
