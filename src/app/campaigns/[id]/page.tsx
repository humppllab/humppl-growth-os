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
  Users, 
  Mail, 
  Clock, 
  AlertCircle,
  X,
  Check
} from "lucide-react";
import { 
  getCampaignDetail, 
  getCampaignMembers, 
  addCampaignMember, 
  logEmailCampaignActivity,
  getContacts,
  getLeads
} from "@/actions";
import { toast } from "@/components/ui/Toast";

interface Campaign {
  id: string;
  created_at: string;
  title: string;
  objective: string;
  audience_segment: string;
  status: 'Planned' | 'Active' | 'Completed' | 'Cancelled';
  owner: string;
}

interface Member {
  id: string;
  created_at: string;
  campaign_id: string;
  contact_id?: number | null;
  lead_id?: number | null;
  status: string;
  contacts?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  leads?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available contacts / leads to add
  const [contacts, setContacts] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberType, setMemberType] = useState<"contact" | "lead">("contact");
  const [selectedEntityId, setSelectedEntityId] = useState("");

  // Email Send Composer State
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const campData = await getCampaignDetail(id);
      if (!campData) {
        setError("Campaign not found.");
        return;
      }
      setCampaign(campData);

      const [membersData, contactsData, leadsData] = await Promise.all([
        getCampaignMembers(id),
        getContacts(),
        getLeads()
      ]);
      setMembers(membersData);
      setContacts(contactsData);
      setLeads(leadsData);
    } catch (err: any) {
      console.error(err);
      setError("Error loading campaign details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntityId) return;

    try {
      const entityIdNum = parseInt(selectedEntityId);
      const isContact = memberType === "contact";
      
      // Check if already in campaign
      const exists = members.some(m => isContact ? m.contact_id === entityIdNum : m.lead_id === entityIdNum);
      if (exists) {
        toast.error("Member already exists in this campaign.");
        return;
      }

      const newMember = await addCampaignMember(
        id, 
        isContact ? entityIdNum : undefined, 
        !isContact ? entityIdNum : undefined
      );

      if (newMember) {
        toast.success("Member added to campaign.");
        setShowAddMemberModal(false);
        setSelectedEntityId("");
        // Refresh members
        const refreshed = await getCampaignMembers(id);
        setMembers(refreshed);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Error adding member: " + err.message);
    }
  };

  const openEmailComposer = (member: Member) => {
    setSelectedMember(member);
    const name = member.contacts 
      ? `${member.contacts.first_name} ${member.contacts.last_name}` 
      : `${member.leads?.first_name} ${member.leads?.last_name}`;
    
    setEmailSubject(`Proposal Discussion - ${campaign?.title}`);
    setEmailBody(`Dear ${name},\n\nI hope this email finds you well. I wanted to reach out regarding our customized HR and Consulting solutions...\n\nBest regards,\nGrowth OS Team`);
    setShowEmailComposer(true);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !emailSubject || !emailBody) return;
    setSendingEmail(true);
    try {
      // In this setup, we log email for campaigns contact
      const contactId = selectedMember.contact_id || 0; 
      if (contactId) {
        await logEmailCampaignActivity(id, contactId, emailSubject, emailBody);
        toast.success("Outreach email logged and sent.");
      } else {
        toast.success("Outreach logged for Lead.");
      }
      
      // Update local member status to 'Sent'
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, status: 'Sent' } : m));
      setShowEmailComposer(false);
      setSelectedMember(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to log campaign email: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading campaign...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/campaigns" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
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
          <Link href="/campaigns" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Campaigns
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
            <Badge variant="secondary">{campaign.status}</Badge>
          </div>
          <p className="text-sm text-gray-500 font-medium">Objective: {campaign.objective}</p>
        </div>
        <div>
          <Button onClick={() => setShowAddMemberModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Campaign Details</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Target Segment</span>
                <span className="font-semibold text-gray-800">{campaign.audience_segment || 'All Contacts'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Campaign Owner</span>
                <span className="font-semibold text-gray-800">{campaign.owner || 'System'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Start Date</span>
                <span className="font-semibold text-gray-800">{new Date(campaign.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <div>
                <CardTitle className="text-lg">Audience Members</CardTitle>
                <CardDescription>View, compose emails, and track conversion funnel state.</CardDescription>
              </div>
              <Badge variant="outline" className="font-bold">{members.length} Members</Badge>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No audience members added yet. Click "Add Member" to populate the list.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Outreach</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {members.map((member) => {
                        const isContact = !!member.contact_id;
                        const entity = isContact ? member.contacts : member.leads;
                        if (!entity) return null;
                        
                        return (
                          <tr key={member.id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-gray-800">
                              {entity.first_name} {entity.last_name}
                            </td>
                            <td className="p-3">
                              <Badge variant={isContact ? "default" : "outline"}>
                                {isContact ? "Contact" : "Lead"}
                              </Badge>
                            </td>
                            <td className="p-3 text-gray-600">{entity.email}</td>
                            <td className="p-3">
                              <Badge variant="secondary">{member.status}</Badge>
                            </td>
                            <td className="p-3">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEmailComposer(member)}
                                className="h-7 px-2 text-xs"
                              >
                                <Mail className="h-3.5 w-3.5 mr-1" /> Compose
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add Audience Member</h2>
              <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source Pool</label>
                <div className="flex gap-4">
                  <label className="flex items-center text-sm cursor-pointer select-none">
                    <input 
                      type="radio" name="mType" checked={memberType === "contact"} 
                      onChange={() => { setMemberType("contact"); setSelectedEntityId(""); }}
                      className="mr-2 text-blue-600"
                    /> Contacts Pool
                  </label>
                  <label className="flex items-center text-sm cursor-pointer select-none">
                    <input 
                      type="radio" name="mType" checked={memberType === "lead"} 
                      onChange={() => { setMemberType("lead"); setSelectedEntityId(""); }}
                      className="mr-2 text-blue-600"
                    /> Leads Pool
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Person *</label>
                <select 
                  value={selectedEntityId} 
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  required
                >
                  <option value="">-- Choose Profile --</option>
                  {memberType === "contact" ? (
                    contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.email})</option>)
                  ) : (
                    leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} ({l.email})</option>)
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setShowAddMemberModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedEntityId}>
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && selectedMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Compose Outreach Email</h2>
              <button onClick={() => { setShowEmailComposer(false); setSelectedMember(null); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Recipient</span>
                <span className="text-sm font-semibold text-gray-800">
                  {selectedMember.contacts 
                    ? `${selectedMember.contacts.first_name} ${selectedMember.contacts.last_name} (${selectedMember.contacts.email})` 
                    : `${selectedMember.leads?.first_name} ${selectedMember.leads?.last_name} (${selectedMember.leads?.email})`
                  }
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
                <input 
                  type="text" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Body Text *</label>
                <textarea 
                  required value={emailBody} onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-sans"
                  rows={6}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => { setShowEmailComposer(false); setSelectedMember(null); }} disabled={sendingEmail}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendingEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {sendingEmail ? "Logging Outreach..." : "Log & Send Email"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
