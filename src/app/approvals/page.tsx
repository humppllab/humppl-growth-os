'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Check, X, Plus, Loader2 } from "lucide-react";
import { getApprovals, createApproval, updateApprovalStatus, getOrganizations } from "@/actions";
import { formatRupees } from "@/lib/utils";

interface Organization {
  id: number;
  name: string;
}

interface Approval {
  id: string;
  created_at: string;
  title: string;
  organization_id: number;
  value: number;
  status: string;
  organizations?: {
    name: string;
  } | null;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [value, setValue] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [appsData, orgsData] = await Promise.all([
          getApprovals(),
          getOrganizations()
        ]);
        setApprovals(appsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load approvals data:", err);
        setError("Could not load approvals. Please try again.");
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
      const newApp = await createApproval(title, orgId, valNum, "Pending");
      if (newApp) {
        const orgObj = organizations.find(o => o.id === orgId);
        const appWithOrg: Approval = {
          ...newApp,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setApprovals([appWithOrg, ...approvals]);
        setIsModalOpen(false);
        setTitle("");
        setValue("");
      }
    } catch (err: any) {
      console.error("Failed to create approval:", err);
      setError("Failed to request approval. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, nextStatus: 'Approved' | 'Rejected') => {
    setActioningId(id);
    try {
      const updated = await updateApprovalStatus(id, nextStatus);
      if (updated) {
        setApprovals(approvals.map(app => app.id === id ? { ...app, status: updated.status } : app));
      }
    } catch (err) {
      console.error("Failed to update approval status:", err);
    } finally {
      setActioningId(null);
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
          <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage pending approval requests.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Request Approval
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
      ) : approvals.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No approvals found. Click "Request Approval" to create one.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request Title / Client</TableHead>
              <TableHead>Client Organization</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[200px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell className="font-medium text-gray-900">{approval.title}</TableCell>
                <TableCell>{approval.organizations?.name || '--'}</TableCell>
                <TableCell>{formatRupees(approval.value)}</TableCell>
                <TableCell>{formatDateString(approval.created_at)}</TableCell>
                <TableCell>
                  <Badge variant={approval.status === 'Approved' ? 'success' : approval.status === 'Rejected' ? 'destructive' : 'warning'}>
                    {approval.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {approval.status === 'Pending' && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={actioningId === approval.id}
                        onClick={() => handleAction(approval.id, 'Approved')}
                        className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                      >
                        <Check className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={actioningId === approval.id}
                        onClick={() => handleAction(approval.id, 'Rejected')}
                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <X className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </>
                  )}
                  {approval.status !== 'Pending' && (
                    <span className="text-sm text-gray-400 italic">No action needed</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Request Approval Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Request Approval</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Request Title *</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Discount 15% - Innovate LLC" 
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deal / Contract Value (INR) *</label>
                <input 
                  type="number" 
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 150000" 
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
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Requesting...
                    </>
                  ) : "Submit Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
