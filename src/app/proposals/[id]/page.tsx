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
  FileText, 
  Building2, 
  Calendar,
  AlertCircle,
  Calculator,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Percent
} from "lucide-react";
import { 
  getProposalDetail, 
  createPricingItem, 
  deletePricingItem, 
  updateProposalValue,
  createApproval
} from "@/actions";
import { formatRupees } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";

interface PricingItem {
  id: number;
  proposal_id: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  discount: number;
  total: number;
}

interface ApprovalRequest {
  id: string;
  title: string;
  reason?: string;
  requested_value: number;
  status: string;
  decision_notes?: string;
}

interface ProposalDetail {
  id: string;
  created_at: string;
  title: string;
  organization_id: number;
  opportunity_id?: string;
  value: number;
  status: string;
  date_sent?: string;
  validity_date?: string;
  payment_terms?: string;
  scope?: string;
  pricing_model?: string;
  organizations?: {
    id: number;
    name: string;
  } | null;
  pricing_items?: PricingItem[];
  approval_requests?: ApprovalRequest[];
}

const PRICING_MODELS = [
  "One-time project",
  "Monthly retainer",
  "Per student",
  "Per batch",
  "Per campus",
  "Per hire",
  "Success fee",
  "Hybrid",
  "Custom"
];

export default function ProposalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Line Item Form State
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [rate, setRate] = useState("");
  const [discount, setDiscount] = useState("0");
  const [addingItem, setAddingItem] = useState(false);

  // Approval Submission State
  const [submittingApproval, setSubmittingApproval] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProposalDetail(id);
      if (!data) {
        setError("Proposal not found.");
        return;
      }
      setProposal(data);
    } catch (err: any) {
      console.error(err);
      setError("Error loading proposal details. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposal || !itemName || !rate) return;
    setAddingItem(true);
    try {
      const qtyNum = parseFloat(quantity) || 1;
      const rateNum = parseFloat(rate) || 0;
      const discNum = parseFloat(discount) || 0;
      const totalNum = qtyNum * rateNum * (1 - discNum / 100);

      const newItem = await createPricingItem({
        proposal_id: id,
        name: itemName,
        description: itemDesc,
        quantity: qtyNum,
        rate: rateNum,
        discount: discNum,
        total: totalNum
      });

      if (newItem) {
        toast.success("Pricing line item added.");
        
        // Recalculate total proposal value
        const updatedItems = [...(proposal.pricing_items || []), newItem];
        const newTotalValue = updatedItems.reduce((sum, item) => sum + Number(item.total), 0);
        
        await updateProposalValue(id, newTotalValue);
        
        setItemName("");
        setItemDesc("");
        setQuantity("1");
        setRate("");
        setDiscount("0");

        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to add pricing item: " + err.message);
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!proposal) return;
    try {
      await deletePricingItem(itemId);
      toast.success("Pricing item removed.");
      
      const updatedItems = (proposal.pricing_items || []).filter(item => item.id !== itemId);
      const newTotalValue = updatedItems.reduce((sum, item) => sum + Number(item.total), 0);
      
      await updateProposalValue(id, newTotalValue);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete pricing item.");
    }
  };

  const handleRequestApproval = async () => {
    if (!proposal) return;
    setSubmittingApproval(true);
    try {
      // Calculate highest discount percentage in pricing items
      const items = proposal.pricing_items || [];
      const highestDiscount = items.reduce((max, item) => Math.max(max, Number(item.discount) || 0), 0);
      
      let reason = `Standard commercial terms approval requested for proposal "${proposal.title}".`;
      if (highestDiscount > 15) {
        reason = `Requested discount of ${highestDiscount}% exceeds the 15% threshold. Special leadership approval required.`;
      }

      const approval = await createApproval(
        `Commercial Approval for ${proposal.title}`,
        proposal.organization_id,
        proposal.value,
        'Pending',
        proposal.id,
        proposal.opportunity_id,
        reason
      );

      if (approval) {
        toast.success("Approval request submitted successfully.");
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to submit approval: " + err.message);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge className="bg-emerald-100 text-emerald-800 font-semibold">Approved</Badge>;
      case 'Draft': return <Badge variant="secondary">Draft</Badge>;
      case 'Approval Pending':
      case 'Pending': return <Badge className="bg-amber-100 text-amber-800 animate-pulse font-semibold">Approval Pending</Badge>;
      case 'Rejected': return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Loading proposal details...</p>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-2xl p-6 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="font-bold text-gray-900 text-lg">Error</h2>
        <p className="text-sm text-red-700">{error || "Something went wrong."}</p>
        <Link href="/proposals" className="inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Proposals
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
          <Link href="/proposals" className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Proposals
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
            {getStatusBadge(proposal.status)}
          </div>
          <p className="text-sm text-gray-500 flex items-center font-medium">
            <Building2 className="h-4 w-4 mr-1 text-gray-400" />
            {proposal.organizations?.name || "Independent"}
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-500 block font-medium">Total Quote</span>
          <span className="text-2xl font-bold text-blue-600">{formatRupees(proposal.value)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Metadata & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Commercial Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm font-medium">
              <div>
                <span className="text-xs text-gray-400 block font-medium">Pricing Model</span>
                <span className="text-gray-800 font-semibold">{proposal.pricing_model || 'One-time project'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Date Sent</span>
                <span className="text-gray-800 font-semibold">{proposal.date_sent ? new Date(proposal.date_sent).toLocaleDateString() : '--'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Validity Date</span>
                <span className="text-gray-800 font-semibold">{proposal.validity_date ? new Date(proposal.validity_date).toLocaleDateString() : '--'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-medium">Payment Terms</span>
                <span className="text-gray-800 font-semibold">{proposal.payment_terms || 'Net 30'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Approvals history */}
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4.5 w-4.5 text-blue-600" /> Approval Workflow</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {proposal.approval_requests && proposal.approval_requests.length > 0 ? (
                proposal.approval_requests.map((app) => (
                  <div key={app.id} className="p-3 border rounded-xl bg-slate-50 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800">Request</span>
                      {getStatusBadge(app.status)}
                    </div>
                    {app.reason && <p className="text-gray-500 font-medium">{app.reason}</p>}
                    {app.decision_notes && (
                      <p className="border-t pt-1.5 text-gray-600 font-medium">
                        <strong>Feedback:</strong> {app.decision_notes}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">
                  No approval requests submitted yet.
                </div>
              )}

              {proposal.status === 'Draft' && (
                <Button 
                  onClick={handleRequestApproval} 
                  disabled={submittingApproval || proposal.value === 0}
                  className="w-full mt-2"
                >
                  {submittingApproval ? "Submitting..." : "Request Internal Approval"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: Pricing line items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-gray-400" /> Pricing Calculator & Line Items
              </CardTitle>
              <CardDescription>Add services, licensing models, student quantities, and discount rates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Existing items */}
              {!proposal.pricing_items || proposal.pricing_items.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm border-dashed border-2 rounded-xl">
                  No pricing line items added. Populate the calculator below.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase">Item Name</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Qty</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Rate</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Discount</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                        <th className="p-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-gray-700">
                      {proposal.pricing_items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold text-gray-900">
                            {item.name}
                            {item.description && <p className="text-xs font-normal text-gray-400 mt-0.5">{item.description}</p>}
                          </td>
                          <td className="p-3 text-right">{item.quantity}</td>
                          <td className="p-3 text-right">{formatRupees(item.rate)}</td>
                          <td className="p-3 text-right text-rose-600 flex items-center justify-end gap-0.5">
                            <Percent className="h-3 w-3" /> {item.discount}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">{formatRupees(item.total)}</td>
                          <td className="p-3 text-right">
                            <button onClick={() => handleDeleteItem(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Calculator compose form */}
              {proposal.status === 'Draft' && (
                <form onSubmit={handleAddItem} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Plus className="h-4 w-4 text-blue-600" /> Add Pricing Item</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" required value={itemName} onChange={(e) => setItemName(e.target.value)}
                      placeholder="Item name (e.g. Executive Retainer Q3)" className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    />
                    <input 
                      type="text" value={itemDesc} onChange={(e) => setItemDesc(e.target.value)}
                      placeholder="Description details (optional)" className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                      <input 
                        type="number" min="1" step="any" required value={quantity} onChange={(e) => setQuantity(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rate (INR)</label>
                      <input 
                        type="number" required value={rate} onChange={(e) => setRate(e.target.value)}
                        placeholder="Rate" className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Discount (%)</label>
                      <input 
                        type="number" min="0" max="100" required value={discount} onChange={(e) => setDiscount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-gray-500 font-semibold">
                      Subtotal: {formatRupees((parseFloat(quantity) || 1) * (parseFloat(rate) || 0) * (1 - (parseFloat(discount) || 0) / 100))}
                    </span>
                    <Button type="submit" disabled={addingItem || !itemName || !rate}>
                      {addingItem ? "Adding..." : "Add to Proposal"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
