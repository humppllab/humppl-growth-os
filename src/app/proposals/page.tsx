'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, FileText, X, Loader2 } from "lucide-react";
import { getProposals, createProposal, getOrganizations } from "@/actions";
import { formatRupees } from "@/lib/utils";

interface Organization {
  id: number;
  name: string;
}

interface Proposal {
  id: string;
  created_at: string;
  title: string;
  organization_id: number;
  value: number;
  date_sent: string;
  status: string;
  organizations?: {
    name: string;
  } | null;
}

const PROPOSAL_STATUSES = [
  "Draft",
  "Sent",
  "Under Discussion",
  "Approval Pending",
  "Accepted",
  "Rejected",
  "Expired"
];

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [value, setValue] = useState("");
  const [status, setStatus] = useState("Draft");
  const [dateSent, setDateSent] = useState(new Date().toISOString().split('T')[0]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [propsData, orgsData] = await Promise.all([
          getProposals(),
          getOrganizations()
        ]);
        setProposals(propsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load proposals data:", err);
        setError("Could not load proposals. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !organizationId || !value) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const valNum = parseFloat(value) || 0;
      const newProp = await createProposal(title, orgId, valNum, status, dateSent);
      if (newProp) {
        const orgObj = organizations.find(o => o.id === orgId);
        const propWithOrg: Proposal = {
          ...newProp,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setProposals([propWithOrg, ...proposals]);
        setIsModalOpen(false);
        setTitle("");
        setValue("");
        setStatus("Draft");
        setDateSent(new Date().toISOString().split('T')[0]);
      }
    } catch (err: any) {
      console.error("Failed to create proposal:", err);
      setError("Failed to create proposal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'Accepted': return 'success';
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Under Discussion': return 'warning';
      case 'Approval Pending': return 'warning';
      case 'Rejected': return 'destructive';
      case 'Expired': return 'outline';
      default: return 'default';
    }
  };

  const formatDateString = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">Track proposal statuses and document lifecycles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Proposal
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
      ) : proposals.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No proposals found. Click "Create Proposal" to create one.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proposal Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date Sent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell className="font-medium text-blue-600 flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-gray-400 shrink-0" />
                  {proposal.title}
                </TableCell>
                <TableCell>{proposal.organizations?.name || '--'}</TableCell>
                <TableCell>{formatRupees(proposal.value)}</TableCell>
                <TableCell>{formatDateString(proposal.date_sent)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(proposal.status)}>
                    {proposal.status}
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

      {/* Create Proposal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Create New Proposal</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proposal Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HR Transformation Blueprint" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Organization *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value (INR) *</label>
                  <input 
                    type="number" 
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. 100000" 
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
                    {PROPOSAL_STATUSES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Sent *</label>
                <input 
                  type="date" 
                  required
                  value={dateSent}
                  onChange={(e) => setDateSent(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !title || !organizationId || !value}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
