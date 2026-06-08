'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal, FileText, Link as LinkIcon, FileImage, X, Loader2, Trash2, RefreshCw, Tag, Layers, Upload, Download, Printer, SlidersHorizontal } from "lucide-react";
import { getDocuments, createDocument, getOrganizations } from "@/actions";
import EmailComposerButton from "@/components/ui/EmailComposerButton";
import { ThreeDotMenu, ThreeDotMenuItemProps } from "@/components/ui/ThreeDotMenu";

interface Organization {
  id: number;
  name: string;
}

interface Document {
  id: string;
  created_at: string;
  name: string;
  type: string;
  organization_id: number;
  date_uploaded: string;
  size: string;
  file_url: string | null;
  organizations?: {
    name: string;
  } | null;
}

const DOCUMENT_TYPES = [
  "Presentation",
  "Agreement",
  "Drive Link",
  "Proposal Deck",
  "Other"
];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState(DOCUMENT_TYPES[0]);
  const [organizationId, setOrganizationId] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [size, setSize] = useState("1.5 MB");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [docsData, orgsData] = await Promise.all([
          getDocuments(),
          getOrganizations()
        ]);
        setDocuments(docsData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load documents data:", err);
        setError("Could not load documents. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !organizationId) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const computedSize = type === 'Drive Link' ? '--' : size;
      const newDoc = await createDocument(name, type, orgId, fileUrl || undefined, computedSize);
      if (newDoc) {
        const orgObj = organizations.find(o => o.id === orgId);
        const docWithOrg: Document = {
          ...newDoc,
          organizations: orgObj ? { name: orgObj.name } : null
        };
        setDocuments([docWithOrg, ...documents]);
        setIsModalOpen(false);
        setName("");
        setType(DOCUMENT_TYPES[0]);
        setFileUrl("");
        setSize("1.5 MB");
      }
    } catch (err: any) {
      console.error("Failed to create document:", err);
      setError("Failed to upload document. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'Presentation':
      case 'Proposal Deck': return <FileImage className="mr-3 h-5 w-5 text-blue-500 shrink-0" />;
      case 'Drive Link': return <LinkIcon className="mr-3 h-5 w-5 text-indigo-500 shrink-0" />;
      case 'Agreement': return <FileText className="mr-3 h-5 w-5 text-emerald-500 shrink-0" />;
      default: return <FileText className="mr-3 h-5 w-5 text-gray-400 shrink-0" />;
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
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and access all client files and agreements.</p>
        </div>
        <div className="flex items-center gap-3">
          <EmailComposerButton />

          {/* Three Dot Menu */}
          <ThreeDotMenu
            items={[
              { label: "Mass Delete", href: "/documents/mass-delete", icon: <Trash2 className="h-4 w-4" />, variant: "destructive" },
              { label: "Mass Update", href: "/documents/mass-update", icon: <RefreshCw className="h-4 w-4" /> },
              { label: "Manage Tags", href: "/documents/manage-tags", icon: <Tag className="h-4 w-4" /> },
              { label: "Drafts", href: "/documents/drafts", icon: <FileText className="h-4 w-4" /> },
              { label: "Deduplicate", href: "/documents/deduplicate", icon: <Layers className="h-4 w-4" /> },
              { divider: true } as ThreeDotMenuItemProps,
              { label: "Import", href: "/documents/import", icon: <Upload className="h-4 w-4" /> },
              { label: "Export", href: "/documents/export", icon: <Download className="h-4 w-4" /> },
              { label: "Print View", href: "/documents/print-view", icon: <Printer className="h-4 w-4" /> },
            ]}
          />

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Upload Document
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
      ) : documents.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No documents found. Click "Upload Document" to add one.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date Uploaded</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium text-gray-900 flex items-center">
                  {getIcon(doc.type)}
                  {doc.file_url ? (
                    <a 
                      href={doc.file_url.startsWith('http') ? doc.file_url : `https://${doc.file_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {doc.name}
                    </a>
                  ) : doc.name}
                </TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>{doc.organizations?.name || '--'}</TableCell>
                <TableCell>{formatDateString(doc.date_uploaded)}</TableCell>
                <TableCell>{doc.size}</TableCell>
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

      {/* Upload Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Upload New Document</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Project Delivery Folder" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select 
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                  >
                    {DOCUMENT_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Size</label>
                  <input 
                    type="text" 
                    disabled={type === 'Drive Link'}
                    value={type === 'Drive Link' ? '--' : size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 1.2 MB" 
                    className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">File / Share URL</label>
                <input 
                  type="text" 
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="e.g. https://drive.google.com/..." 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !name || !organizationId}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Uploading...
                    </>
                  ) : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
