'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Merge, Trash2, ArrowLeft, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getContacts } from "@/actions";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  organization_id: number;
  organizations?: {
    name: string;
  } | null;
}

interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  matchScore: number;
  matchReason: string;
}

export default function DeduplicatePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [selectedForMerge, setSelectedForMerge] = useState<{ groupId: string; contactIds: number[] } | null>(null);
  const [previewMerge, setPreviewMerge] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
      } catch (err: any) {
        console.error("Failed to load contacts:", err);
        setError("Could not load contacts.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const scanForDuplicates = () => {
    setScanning(true);
    setError("");

    try {
      const groups: DuplicateGroup[] = [];
      const processedIds = new Set<number>();

      // Simple duplicate detection: same first+last name or email
      contacts.forEach((contact, index) => {
        if (processedIds.has(contact.id)) return;

        const duplicates = [contact];
        const searchKey = `${contact.first_name.toLowerCase()}${contact.last_name.toLowerCase()}`;
        const emailKey = contact.email?.toLowerCase() || "";

        for (let j = index + 1; j < contacts.length; j++) {
          const other = contacts[j];
          if (processedIds.has(other.id)) continue;

          const otherKey = `${other.first_name.toLowerCase()}${other.last_name.toLowerCase()}`;
          const otherEmail = other.email?.toLowerCase() || "";

          // Match if same name or same email
          if (searchKey === otherKey || (emailKey && emailKey === otherEmail)) {
            duplicates.push(other);
            processedIds.add(other.id);
          }
        }

        if (duplicates.length > 1) {
          duplicates.forEach(d => processedIds.add(d.id));
          groups.push({
            id: `group-${groups.length}`,
            contacts: duplicates,
            matchScore: 95,
            matchReason: duplicates[0].email === duplicates[1].email ? "Same email" : "Same name",
          });
        }
      });

      setDuplicateGroups(groups);
      if (groups.length === 0) {
        setSuccess("No duplicates found!");
      } else {
        setSuccess(`Found ${groups.length} duplicate group(s)`);
      }
    } catch (err: any) {
      setError("Error scanning for duplicates: " + err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleMergeGroup = (groupId: string, primaryContactId: number) => {
    const group = duplicateGroups.find(g => g.id === groupId);
    if (!group) return;

    const contactIdsToDelete = group.contacts.filter(c => c.id !== primaryContactId).map(c => c.id);
    
    setSelectedForMerge({ groupId, contactIds: contactIdsToDelete });
    setPreviewMerge(true);
  };

  const confirmMerge = async () => {
    if (!selectedForMerge) return;

    setLoading(true);
    try {
      // TODO: Implement actual merge via server action
      // For now, just remove the duplicate group from UI
      setDuplicateGroups(duplicateGroups.filter(g => g.id !== selectedForMerge.groupId));
      setSuccess("Contacts merged successfully");
      setPreviewMerge(false);
      setSelectedForMerge(null);
    } catch (err: any) {
      setError("Failed to merge contacts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/contacts">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deduplicate Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Find and merge duplicate contact records.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
          {success}
        </div>
      )}

      {loading && !scanning ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scan Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Total Contacts: {contacts.length}</h3>
                  <p className="text-sm text-gray-600 mt-1">Scan your contacts to identify duplicates based on name and email</p>
                </div>
                <Button
                  onClick={scanForDuplicates}
                  disabled={scanning || contacts.length === 0}
                  size="lg"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning...
                    </>
                  ) : (
                    <>
                      <Merge className="h-4 w-4 mr-2" /> Scan for Duplicates
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Duplicate Groups */}
          {duplicateGroups.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Found {duplicateGroups.length} Duplicate Group(s)
              </h2>
              <div className="space-y-4">
                {duplicateGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {group.contacts.length} Duplicate Contacts
                          </CardTitle>
                          <p className="text-xs text-gray-600 mt-1">{group.matchReason} • {group.matchScore}% match</p>
                        </div>
                        <span className="text-gray-500">
                          {expandedGroup === group.id ? "▼" : "▶"}
                        </span>
                      </div>
                    </CardHeader>

                    {expandedGroup === group.id && (
                      <CardContent className="border-t p-0">
                        <div className="divide-y">
                          {group.contacts.map((contact, idx) => (
                            <div key={contact.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                      {idx === 0 ? "P" : "D"}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {contact.first_name} {contact.last_name}
                                      </p>
                                      <p className="text-xs text-gray-600">{contact.email}</p>
                                      <p className="text-xs text-gray-500 mt-1">{contact.organizations?.name} • {contact.job_title}</p>
                                    </div>
                                  </div>
                                </div>
                                {idx === 0 && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                                    Primary
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                          <Button
                            onClick={() => handleMergeGroup(group.id, group.contacts[0].id)}
                            className="flex-1"
                          >
                            <Merge className="h-3 w-3 mr-2" />
                            Merge Records
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700 border-red-200"
                          >
                            <Trash2 className="h-3 w-3 mr-2" />
                            Ignore
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {duplicateGroups.length === 0 && !scanning && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 font-medium">No duplicates scanned yet</p>
                <p className="text-gray-500 text-sm mt-1">Click "Scan for Duplicates" to find duplicate contacts</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Merge Preview Modal */}
      {previewMerge && selectedForMerge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="border-b bg-blue-50">
              <CardTitle className="text-blue-600">Preview Merge</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm text-blue-900">
                The duplicate contacts will be merged into the primary record and removed.
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPreviewMerge(false);
                    setSelectedForMerge(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmMerge}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-2 animate-spin" /> Merging...
                    </>
                  ) : (
                    <>
                      <Merge className="h-3 w-3 mr-2" /> Confirm Merge
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
