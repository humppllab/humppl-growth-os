'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, ArrowUpDown, Trash2, RefreshCw, Tag, FileText, Layers, Upload, Download, Printer } from "lucide-react";
import Link from "next/link";
import { getOpportunities, createOpportunity, getOrganizations } from "@/actions";
import { formatRupees } from "@/lib/utils";
import { ThreeDotMenu, ThreeDotMenuItemProps } from "@/components/ui/ThreeDotMenu";

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

  // Zoho-style Filters & Sorting state
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "value_desc" | "value_asc" | "name">("newest");
  
  // Row checkboxes state
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

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

  // Filter handlers
  const handleStageCheckbox = (stageName: string) => {
    if (selectedStages.includes(stageName)) {
      setSelectedStages(selectedStages.filter(s => s !== stageName));
    } else {
      setSelectedStages([...selectedStages, stageName]);
    }
  };

  const handleTypeCheckbox = (typeName: string) => {
    if (selectedTypes.includes(typeName)) {
      setSelectedTypes(selectedTypes.filter(t => t !== typeName));
    } else {
      setSelectedTypes([...selectedTypes, typeName]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedStages([]);
    setSelectedTypes([]);
    setMinValue("");
    setMaxValue("");
    setSortBy("newest");
  };

  // Row selection handlers
  const toggleSelectRow = (oppId: string) => {
    if (selectedRowIds.includes(oppId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== oppId));
    } else {
      setSelectedRowIds([...selectedRowIds, oppId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredOpps: Opportunity[]) => {
    if (selectedRowIds.length === currentFilteredOpps.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredOpps.map(o => o.id));
    }
  };

  // Local filtering logic
  const filteredOpps = opportunities.filter(opp => {
    const matchesSearch = 
      opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opp.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.owner.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStage = selectedStages.length === 0 || selectedStages.includes(opp.stage);
    const matchesType = selectedTypes.length === 0 || selectedTypes.includes(opp.type);
    
    const val = opp.value || 0;
    const matchesMin = !minValue || val >= parseFloat(minValue);
    const matchesMax = !maxValue || val <= parseFloat(maxValue);

    return matchesSearch && matchesStage && matchesType && matchesMin && matchesMax;
  });

  // Local sorting logic
  const sortedOpps = [...filteredOpps].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "value_desc") {
      return b.value - a.value;
    }
    if (sortBy === "value_asc") {
      return a.value - b.value;
    }
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your sales opportunities.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`h-10 hover:bg-slate-100 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm ${isFilterOpen ? 'bg-slate-100 ring-2 ring-blue-500/20' : ''}`}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4 text-gray-500" /> Filter
          </Button>

          {/* Three Dot Menu */}
          <ThreeDotMenu
            items={[
              { label: "Mass Delete", href: "/opportunities/mass-delete", icon: <Trash2 className="h-4 w-4" />, variant: "destructive" },
              { label: "Mass Update", href: "/opportunities/mass-update", icon: <RefreshCw className="h-4 w-4" /> },
              { label: "Manage Tags", href: "/opportunities/manage-tags", icon: <Tag className="h-4 w-4" /> },
              { label: "Drafts", href: "/opportunities/drafts", icon: <FileText className="h-4 w-4" /> },
              { label: "Deduplicate", href: "/opportunities/deduplicate", icon: <Layers className="h-4 w-4" /> },
              { divider: true } as ThreeDotMenuItemProps,
              { label: "Import", href: "/opportunities/import", icon: <Upload className="h-4 w-4" /> },
              { label: "Export", href: "/opportunities/export", icon: <Download className="h-4 w-4" /> },
              { label: "Print View", href: "/opportunities/print-view", icon: <Printer className="h-4 w-4" /> },
            ]}
          />

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Opportunity
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
          {/* Collapsible Zoho Filter Panel */}
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Leads by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Clear
                </button>
              </div>

              {/* Text Search inside Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, company..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Sorting Filter */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="newest">Newest Created</option>
                    <option value="value_desc">Value: High to Low</option>
                    <option value="value_asc">Value: Low to High</option>
                    <option value="name">Opportunity Name</option>
                  </select>
                </div>
              </div>

              {/* Deal Value Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Deal Value (INR)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="number" 
                    placeholder="Min"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input 
                    type="number" 
                    placeholder="Max"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Pipeline Stage Checkbox Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Pipeline Stage</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {PIPELINE_STAGES.map(s => (
                    <label key={s} className="flex items-center text-xs text-gray-600 hover:text-gray-900 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedStages.includes(s)}
                        onChange={() => handleStageCheckbox(s)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      {s}
                    </label>
                  ))}
                </div>
              </div>

              {/* Opportunity Type Checkbox Filter */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Opportunity Type</label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {OPPORTUNITY_TYPES.map(t => (
                    <label key={t} className="flex items-center text-xs text-gray-600 hover:text-gray-900 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedTypes.includes(t)}
                        onChange={() => handleTypeCheckbox(t)}
                        className="mr-2 h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Table area */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedOpps.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No matching opportunities found. Adjust your filters or query.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {/* Checkbox columns */}
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedOpps.length && sortedOpps.length > 0}
                          onChange={() => toggleSelectAllRows(sortedOpps)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
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
                    {sortedOpps.map((opp) => (
                      <TableRow key={opp.id} className={selectedRowIds.includes(opp.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(opp.id)}
                            onChange={() => toggleSelectRow(opp.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-blue-600">
                          <Link href={`/opportunities/${opp.id}`} className="hover:underline">
                            {opp.name}
                          </Link>
                        </TableCell>
                        <TableCell>{opp.organizations?.name || '--'}</TableCell>
                        <TableCell className="text-gray-600 text-xs">{opp.type || '--'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{opp.stage}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900">{formatRupees(opp.value)}</TableCell>
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
                
                {/* Zoho CRM style Total Records bar */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>
                    {selectedRowIds.length > 0 && (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                        {selectedRowIds.length} selected
                      </span>
                    )}
                    Total Records: {sortedOpps.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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
