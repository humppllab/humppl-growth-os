'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal, X, Loader2, Search, SlidersHorizontal, Trash2, RefreshCw, Tag, FileText, Layers, Upload, Download, Printer } from "lucide-react";
import Link from "next/link";
import { getOrganizations, createOrganization } from "@/actions";
import { ThreeDotMenu, ThreeDotMenuItemProps } from "@/components/ui/ThreeDotMenu";

interface Organization {
  id: number;
  created_at: string;
  name: string;
  industry: string;
  website_url: string;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Zoho Filters state
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "newest" | "industry">("newest");
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);

  useEffect(() => {
    async function loadOrgs() {
      try {
        const data = await getOrganizations();
        setOrganizations(data);
      } catch (err: any) {
        console.error("Failed to load organizations:", err);
        setError("Could not load organizations. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadOrgs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setError("");
    try {
      const newOrg = await createOrganization(name, industry, websiteUrl);
      if (newOrg) {
        setOrganizations([newOrg, ...organizations]);
        setIsModalOpen(false);
        setName("");
        setIndustry("");
        setWebsiteUrl("");
      }
    } catch (err: any) {
      console.error("Failed to create organization:", err);
      setError("Failed to create organization. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterIndustry("");
    setSortBy("newest");
  };

  // Checkbox row handlers
  const toggleSelectRow = (orgId: number) => {
    if (selectedRowIds.includes(orgId)) {
      setSelectedRowIds(selectedRowIds.filter(id => id !== orgId));
    } else {
      setSelectedRowIds([...selectedRowIds, orgId]);
    }
  };

  const toggleSelectAllRows = (currentFilteredOrgs: Organization[]) => {
    if (selectedRowIds.length === currentFilteredOrgs.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(currentFilteredOrgs.map(o => o.id));
    }
  };

  // Local filtering
  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = 
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (org.industry || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = !filterIndustry || 
      (org.industry || "").toLowerCase().includes(filterIndustry.toLowerCase());

    return matchesSearch && matchesIndustry;
  });

  // Local sorting
  const sortedOrgs = [...filteredOrgs].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "industry") {
      return (a.industry || "").localeCompare(b.industry || "");
    }
    if (sortBy === "newest") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return 0;
  });

  // Get unique list of industries for filters
  const uniqueIndustries = Array.from(
    new Set(organizations.map(o => o.industry).filter(Boolean))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client organizations and companies.</p>
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
              { label: "Mass Delete", href: "/organizations/mass-delete", icon: <Trash2 className="h-4 w-4" />, variant: "destructive" },
              { label: "Mass Update", href: "/organizations/mass-update", icon: <RefreshCw className="h-4 w-4" /> },
              { label: "Manage Tags", href: "/organizations/manage-tags", icon: <Tag className="h-4 w-4" /> },
              { label: "Drafts", href: "/organizations/drafts", icon: <FileText className="h-4 w-4" /> },
              { label: "Deduplicate", href: "/organizations/deduplicate", icon: <Layers className="h-4 w-4" /> },
              { divider: true } as ThreeDotMenuItemProps,
              { label: "Import", href: "/organizations/import", icon: <Upload className="h-4 w-4" /> },
              { label: "Export", href: "/organizations/export", icon: <Download className="h-4 w-4" /> },
              { label: "Print View", href: "/organizations/print-view", icon: <Printer className="h-4 w-4" /> },
            ]}
          />

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Organization
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
          {/* Zoho Collapsible Filter panel */}
          {isFilterOpen && (
            <div className="w-64 bg-white border border-gray-200 rounded-xl p-4 shrink-0 shadow-sm space-y-5 animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm text-gray-900">Filter Orgs by</h3>
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:text-blue-700 font-semibold">
                  Clear
                </button>
              </div>

              {/* Text search */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, industry..."
                    className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Sort By</label>
                <select 
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="newest">Newest Created</option>
                  <option value="name">Company Name</option>
                  <option value="industry">Industry</option>
                </select>
              </div>

              {/* Filter by Industry select */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Industry</label>
                <select 
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">All Industries</option>
                  {uniqueIndustries.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Main Table panel */}
          <div className="flex-1 overflow-x-auto bg-white border border-gray-200 rounded-xl shadow-sm">
            {sortedOrgs.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 text-sm">No organizations found matching the filters.</p>
              </div>
            ) : (
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px] pl-4">
                        <input 
                          type="checkbox" 
                          checked={selectedRowIds.length === sortedOrgs.length && sortedOrgs.length > 0}
                          onChange={() => toggleSelectAllRows(sortedOrgs)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </TableHead>
                      <TableHead>Organization Name</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedOrgs.map((org) => (
                      <TableRow key={org.id} className={selectedRowIds.includes(org.id) ? 'bg-blue-50/20' : ''}>
                        <TableCell className="pl-4">
                          <input 
                            type="checkbox"
                            checked={selectedRowIds.includes(org.id)}
                            onChange={() => toggleSelectRow(org.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">{org.name}</TableCell>
                        <TableCell>{org.industry || '--'}</TableCell>
                        <TableCell>
                          {org.website_url ? (
                            <a 
                              href={org.website_url.startsWith('http') ? org.website_url : `https://${org.website_url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {org.website_url}
                            </a>
                          ) : '--'}
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
                
                {/* Zoho CRM style Total Records bar */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500 font-semibold">
                  <div>
                    {selectedRowIds.length > 0 && (
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mr-2">
                        {selectedRowIds.length} selected
                      </span>
                    )}
                    Total Records: {sortedOrgs.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Organization Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Add New Organization</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. TechCorp Industries" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology, Finance" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input 
                  type="text" 
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="e.g. www.techcorp.com" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !name}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
                    </>
                  ) : "Create Organization"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
