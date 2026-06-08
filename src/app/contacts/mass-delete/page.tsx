'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, X, Loader2, Search, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getContacts, deleteContacts } from "@/actions";

interface Contact {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  organization_id: number;
  organizations?: {
    name: string;
  } | null;
}

interface Criterion {
  id: string;
  field: string;
  operator: string;
  value: string;
}

const CONTACT_FIELDS = [
  { label: "First Name", value: "first_name" },
  { label: "Last Name", value: "last_name" },
  { label: "Email", value: "email" },
  { label: "Designation/Role", value: "job_title" },
  { label: "Organization", value: "organizations.name" },
];

const OPERATORS = [
  { label: "Contains", value: "contains" },
  { label: "Equals", value: "equals" },
  { label: "Starts with", value: "starts_with" },
  { label: "Ends with", value: "ends_with" },
  { label: "Is empty", value: "is_empty" },
];

export default function MassDeletePage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: "1", field: "first_name", operator: "contains", value: "" }
  ]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const parseJobTitle = (title: string) => {
    if (!title) return "--";
    const parts = title.split(" | ");
    return parts[0] || "--";
  };

  const matchesCriterion = (contact: Contact, criterion: Criterion): boolean => {
    let fieldValue = "";

    if (criterion.field === "first_name") fieldValue = contact.first_name || "";
    else if (criterion.field === "last_name") fieldValue = contact.last_name || "";
    else if (criterion.field === "email") fieldValue = contact.email || "";
    else if (criterion.field === "job_title") fieldValue = parseJobTitle(contact.job_title);
    else if (criterion.field === "organizations.name") fieldValue = contact.organizations?.name || "";

    fieldValue = fieldValue.toLowerCase();
    const searchValue = criterion.value.toLowerCase();

    switch (criterion.operator) {
      case "contains":
        return fieldValue.includes(searchValue);
      case "equals":
        return fieldValue === searchValue;
      case "starts_with":
        return fieldValue.startsWith(searchValue);
      case "ends_with":
        return fieldValue.endsWith(searchValue);
      case "is_empty":
        return fieldValue === "";
      default:
        return true;
    }
  };

  const handleSearch = () => {
    setSearching(true);
    setError("");
    setSuccess("");

    try {
      const results = contacts.filter(contact =>
        criteria.every(c => matchesCriterion(contact, c))
      );

      setFilteredContacts(results);
      setSelectedContactIds([]);
    } catch (err: any) {
      setError("Error searching contacts: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const addCriterion = () => {
    const newCriterion: Criterion = {
      id: Date.now().toString(),
      field: "first_name",
      operator: "contains",
      value: ""
    };
    setCriteria([...criteria, newCriterion]);
  };

  const removeCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriterion = (id: string, key: keyof Criterion, value: string) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [key]: value } : c));
  };

  const toggleSelectContact = (id: number) => {
    if (selectedContactIds.includes(id)) {
      setSelectedContactIds(selectedContactIds.filter(cid => cid !== id));
    } else {
      setSelectedContactIds([...selectedContactIds, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedContactIds.length === 0) return;

    setDeleting(true);
    setError("");

    try {
      await deleteContacts(selectedContactIds);
      setSuccess(`Successfully deleted ${selectedContactIds.length} contact(s)`);
      setContacts(contacts.filter(c => !selectedContactIds.includes(c.id)));
      setFilteredContacts(filteredContacts.filter(c => !selectedContactIds.includes(c.id)));
      setSelectedContactIds([]);
      setShowConfirm(false);
    } catch (err: any) {
      setError("Failed to delete contacts: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const [showCriteria, setShowCriteria] = useState(true);

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
            <h1 className="text-xl font-semibold text-gray-900">Mass Delete</h1>
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
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg text-sm border border-green-100 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Criteria Section - Zoho Style */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700">Criteria</h2>
              <button
                onClick={() => setShowCriteria(!showCriteria)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showCriteria ? 'Hide ▼' : 'Show ▲'}
              </button>
            </div>

            {showCriteria && (
              <div className="p-6 space-y-4">
                {criteria.map((criterion, index) => (
                  <div key={criterion.id} className="flex items-start gap-3">
                    {/* Number Circle */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 mt-2">
                      {index + 1}
                    </div>

                    {/* Field Dropdown */}
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={criterion.field}
                        onChange={(e) => updateCriterion(criterion.id, "field", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
                      >
                        <option value="">None</option>
                        {CONTACT_FIELDS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Operator Dropdown */}
                    <div className="flex-1 min-w-[200px]">
                      <select
                        value={criterion.operator}
                        onChange={(e) => updateCriterion(criterion.id, "operator", e.target.value)}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-gray-400 transition-colors"
                      >
                        <option value="">None</option>
                        {OPERATORS.map(op => (
                          <option key={op.value} value={op.value}>{op.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Value Input */}
                    <div className="flex-1 min-w-[300px]">
                      {criterion.operator !== "is_empty" ? (
                        <input
                          type="text"
                          value={criterion.value}
                          onChange={(e) => updateCriterion(criterion.id, "value", e.target.value)}
                          placeholder=""
                          className="w-full px-3 py-2.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
                        />
                      ) : (
                        <div className="w-full px-3 py-2.5 border border-gray-200 rounded text-sm bg-gray-50 text-gray-400">
                          (empty)
                        </div>
                      )}
                    </div>

                    {/* Add/Remove Button */}
                    <div className="flex-shrink-0 flex gap-2 mt-2">
                      {index === criteria.length - 1 && (
                        <button
                          onClick={addCriterion}
                          className="w-7 h-7 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
                          title="Add criterion"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {criteria.length > 1 && (
                        <button
                          onClick={() => removeCriterion(criterion.id)}
                          className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                          title="Remove criterion"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Search Button */}
                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={handleSearch}
                    disabled={searching}
                    className="px-8"
                  >
                    {searching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Searching...
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Results Table */}
          {filteredContacts.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-700">
                  Search Results ({filteredContacts.length})
                </h2>
                {selectedContactIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowConfirm(true)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {selectedContactIds.length} Selected
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[50px]">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500/20"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className={selectedContactIds.includes(contact.id) ? 'bg-red-50/30' : 'hover:bg-gray-50'}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedContactIds.includes(contact.id)}
                            onChange={() => toggleSelectContact(contact.id)}
                            className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500/20"
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{contact.email || "--"}</TableCell>
                        <TableCell className="text-sm text-gray-600">{contact.organizations?.name || "--"}</TableCell>
                        <TableCell className="text-sm text-gray-600">{parseJobTitle(contact.job_title)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
            <div className="px-6 py-4 border-b bg-red-50 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-red-600">Confirm Delete</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to permanently delete <strong>{selectedContactIds.length}</strong> contact(s)? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirm(false)}
                  disabled={deleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="flex-1"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
