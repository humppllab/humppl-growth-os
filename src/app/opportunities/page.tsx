'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2 } from "lucide-react";
import { getOpportunities, createOpportunity, getOrganizations } from "@/actions";
import { formatRupees } from "@/lib/utils";

interface Organization {
  id: number;
  name: string;
}

interface Opportunity {
  id: string;
  created_at: string;
  name: string;
  organization_id: number;
  type: string;
  stage: string;
  value: number;
  owner: string;
  organizations?: {
    name: string;
  } | null;
}

const OPPORTUNITY_TYPES = [
  "People Transformation",
  "Fractional CHRO",
  "HR Consulting",
  "Recruitment",
  "Executive Search",
  "Leadership Training",
  "Campus Transformation",
  "Campus Readiness Mirror",
  "Campus to Corporate",
  "Faculty Catalyst",
  "Soft Skills / NLP / Life Coaching",
  "Other"
];

const PIPELINE_STAGES = [
  "New Lead",
  "Qualified",
  "Meeting Booked",
  "Discovery Done",
  "Solution Mapped",
  "Proposal Draft",
  "Proposal Sent",
  "Follow-Up Active",
  "Negotiation",
  "Approval Pending",
  "Won",
  "Lost",
  "Nurture"
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [type, setType] = useState(OPPORTUNITY_TYPES[0]);
  const [stage, setStage] = useState(PIPELINE_STAGES[0]);
  const [value, setValue] = useState("");
  const [owner, setOwner] = useState("Sumit");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [oppsData, orgsData] = await Promise.all([
          getOpportunities(),
          getOrganizations()
        ]);
        setOpportunities(oppsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err: any) {
        console.error("Failed to load opportunities data:", err);
        setError("Could not load opportunities. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !organizationId || !value) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const valNum = parseFloat(value) || 0;
      const newOpp = await createOpportunity(name, orgId, type, stage, valNum, owner);
      if (newOpp) {
        const orgObj = organizations.find(o => o.id === orgId);
        const oppWithOrg: Opportunity = {
          ...newOpp,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setOpportunities([oppWithOrg, ...opportunities]);
        setIsModalOpen(false);
        setName("");
        setValue("");
        setType(OPPORTUNITY_TYPES[0]);
        setStage(PIPELINE_STAGES[0]);
        setOwner("Sumit");
      }
    } catch (err: any) {
      console.error("Failed to create opportunity:", err);
      setError("Failed to create opportunity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your sales opportunities.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Opportunity
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
      ) : opportunities.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No opportunities found. Click "Add Opportunity" to create one.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity Name</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Deal Value</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium text-blue-600">{opp.name}</TableCell>
                <TableCell>{opp.organizations?.name || '--'}</TableCell>
                <TableCell>{opp.type || '--'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{opp.stage}</Badge>
                </TableCell>
                <TableCell className="font-medium text-gray-900">{formatRupees(opp.value)}</TableCell>
                <TableCell>{opp.owner || '--'}</TableCell>
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

      {/* Add Opportunity Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add New Opportunity</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opportunity Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HR Transformation 2024" 
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    {OPPORTUNITY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage *</label>
                  <select 
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deal Value (INR) *</label>
                  <input 
                    type="number" 
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 50000" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <input 
                    type="text" 
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Sumit" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !name || !organizationId || !value}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create Opportunity"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
