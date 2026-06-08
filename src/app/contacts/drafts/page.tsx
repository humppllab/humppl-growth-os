'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Trash2, Edit2, ArrowLeft, FileText, Loader2, Play, Calendar, Clock } from "lucide-react";
import Link from "next/link";

interface Draft {
  id: string;
  name: string;
  description?: string;
  type: string;
  contactCount: number;
  fieldCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([
    {
      id: "1",
      name: "Tech Leads - Batch Import",
      description: "Preparing bulk import of 15 tech leads from LinkedIn",
      type: "Mass Update",
      contactCount: 15,
      fieldCount: 4,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "HR Department - Deduplication",
      description: "Merged duplicate entries from HR team",
      type: "Deduplicate",
      contactCount: 8,
      fieldCount: 0,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "Q4 Campaign Contacts Update",
      description: "Update designation field for marketing campaign contacts",
      type: "Mass Update",
      contactCount: 42,
      fieldCount: 2,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);

  const handleEditDraft = (draft: Draft) => {
    // TODO: Navigate to edit draft page
    console.log("Edit draft:", draft.id);
  };

  const handleDeleteDraft = (id: string) => {
    setDrafts(drafts.filter(d => d.id !== id));
    setSuccess("Draft deleted successfully");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteSelected = () => {
    if (selectedDraftIds.length === 0) return;
    setDrafts(drafts.filter(d => !selectedDraftIds.includes(d.id)));
    setSuccess(`Deleted ${selectedDraftIds.length} draft(s) successfully`);
    setSelectedDraftIds([]);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleResumeDraft = (draft: Draft) => {
    // TODO: Resume draft - could navigate to mass-update or relevant page with pre-filled data
    console.log("Resume draft:", draft.id);
  };

  const toggleSelectDraft = (id: string) => {
    if (selectedDraftIds.includes(id)) {
      setSelectedDraftIds(selectedDraftIds.filter(dId => dId !== id));
    } else {
      setSelectedDraftIds([...selectedDraftIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedDraftIds.length === drafts.length) {
      setSelectedDraftIds([]);
    } else {
      setSelectedDraftIds(drafts.map(d => d.id));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Mass Update': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Mass Delete': return 'bg-red-100 text-red-700 border-red-200';
      case 'Deduplicate': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Import': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/contacts">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Drafts</h1>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <span className="mr-1">📘</span> Help
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-100">
          {success}
        </div>
      )}

      {/* Drafts Table */}
      {drafts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="py-16 text-center">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved drafts</h3>
            <p className="text-gray-500 text-sm">
              Drafts will appear here when you save bulk operations for later.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Table Header with Actions */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-semibold text-gray-700">
                All Drafts ({drafts.length})
              </h2>
              {selectedDraftIds.length > 0 && (
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {selectedDraftIds.length} selected
                </span>
              )}
            </div>
            {selectedDraftIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedDraftIds.length} Selected
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-[50px]">
                    <input
                      type="checkbox"
                      checked={selectedDraftIds.length === drafts.length && drafts.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">Draft Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow
                    key={draft.id}
                    className={selectedDraftIds.includes(draft.id) ? 'bg-blue-50/30' : 'hover:bg-gray-50'}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedDraftIds.includes(draft.id)}
                        onChange={() => toggleSelectDraft(draft.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          {draft.name}
                        </div>
                        {draft.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {draft.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(draft.type)}`}>
                        {draft.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {draft.contactCount}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {draft.fieldCount || '--'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(draft.createdAt)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTime(draft.createdAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {formatDate(draft.updatedAt)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatTime(draft.updatedAt)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDraft(draft)}
                          className="h-8"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleResumeDraft(draft)}
                          className="h-8"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer Info */}
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
            Total Records: {drafts.length}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-lg">💡</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About Drafts</h3>
            <p className="text-sm text-blue-800">
              When performing bulk operations (Mass Update, Mass Delete, Deduplicate, etc.), you can save your progress as a draft. 
              This allows you to pause work and resume later without losing your criteria and selections.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
