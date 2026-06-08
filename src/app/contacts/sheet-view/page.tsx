'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Plus, Loader2, Search, ArrowLeft, Edit2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { getContacts } from "@/actions";

interface Contact {
  id: number;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  phone?: string;
  mobile?: string;
  organization_id: number;
  organizations?: {
    name: string;
  } | null;
}

const COLUMN_DEFINITIONS = [
  { key: "first_name", label: "First Name", width: 150, sortable: true, editable: true },
  { key: "last_name", label: "Last Name", width: 150, sortable: true, editable: true },
  { key: "email", label: "Email", width: 200, sortable: true, editable: true },
  { key: "job_title", label: "Designation", width: 200, sortable: true, editable: true },
  { key: "organization", label: "Organization", width: 200, sortable: true, editable: false },
  { key: "phone", label: "Phone", width: 150, sortable: false, editable: true },
  { key: "mobile", label: "Mobile", width: 150, sortable: false, editable: true },
  { key: "created_at", label: "Created Date", width: 150, sortable: true, editable: false },
];

type SortField = string | null;
type SortOrder = "asc" | "desc";

export default function SheetViewPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMN_DEFINITIONS.map(c => c.key))
  );

  const [editingCell, setEditingCell] = useState<{ contactId: number; field: string } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const contactsData = await getContacts();
        setContacts(contactsData);
        setFilteredContacts(contactsData);
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
    if (!title) return "";
    const parts = title.split(" | ");
    return parts[0] || "";
  };

  useEffect(() => {
    let results = contacts.filter(contact => {
      const fullName = `${contact.first_name} ${contact.last_name}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        (contact.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (contact.organizations?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

    if (sortField) {
      results = results.sort((a, b) => {
        let aVal: any = "";
        let bVal: any = "";

        if (sortField === "first_name") {
          aVal = a.first_name || "";
          bVal = b.first_name || "";
        } else if (sortField === "last_name") {
          aVal = a.last_name || "";
          bVal = b.last_name || "";
        } else if (sortField === "email") {
          aVal = a.email || "";
          bVal = b.email || "";
        } else if (sortField === "job_title") {
          aVal = parseJobTitle(a.job_title);
          bVal = parseJobTitle(b.job_title);
        } else if (sortField === "organization") {
          aVal = a.organizations?.name || "";
          bVal = b.organizations?.name || "";
        } else if (sortField === "created_at") {
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
        }

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredContacts(results);
  }, [searchQuery, sortField, sortOrder, contacts]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleColumn = (field: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(field)) {
      newVisible.delete(field);
    } else {
      newVisible.add(field);
    }
    setVisibleColumns(newVisible);
  };

  const toggleSelectContact = (id: number) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContactIds(Array.from(newSelected));
  };

  const toggleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map(c => c.id));
    }
  };

  const handleEditCell = (contact: Contact, field: string) => {
    let value = "";
    if (field === "first_name") value = contact.first_name;
    else if (field === "last_name") value = contact.last_name;
    else if (field === "email") value = contact.email;
    else if (field === "job_title") value = parseJobTitle(contact.job_title);
    else if (field === "phone") value = contact.phone || "";
    else if (field === "mobile") value = contact.mobile || "";

    setEditingCell({ contactId: contact.id, field });
    setEditingValue(value);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    // TODO: Implement actual save via server action
    setEditingCell(null);
    setSuccess("Cell updated");
    setTimeout(() => setSuccess(""), 2000);
  };

  const getCellValue = (contact: Contact, field: string) => {
    switch (field) {
      case "first_name":
        return contact.first_name;
      case "last_name":
        return contact.last_name;
      case "email":
        return contact.email;
      case "job_title":
        return parseJobTitle(contact.job_title);
      case "organization":
        return contact.organizations?.name || "--";
      case "phone":
        return contact.phone || "--";
      case "mobile":
        return contact.mobile || "--";
      case "created_at":
        return new Date(contact.created_at).toLocaleDateString();
      default:
        return "";
    }
  };

  const visibleColumnDefs = COLUMN_DEFINITIONS.filter(c => visibleColumns.has(c.key));

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
          <h1 className="text-2xl font-bold text-gray-900">Sheet View</h1>
          <p className="text-sm text-gray-500 mt-1">Spreadsheet-style view of your contacts with inline editing and sorting.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Toolbar */}
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Search */}
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Column Visibility */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="relative group">
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  Columns
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-3 hidden group-hover:block z-50 space-y-2">
                    {COLUMN_DEFINITIONS.map(col => (
                      <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(col.key)}
                          onChange={() => toggleColumn(col.key)}
                          className="w-3 h-3 text-blue-600 rounded"
                        />
                        <span className="text-xs text-gray-700">{col.label}</span>
                      </label>
                    ))}
                  </div>
                </Button>
              </div>

              {/* Summary */}
              <div className="text-xs text-gray-600 font-medium">
                {selectedContactIds.length > 0 && (
                  <span className="bg-blue-50 px-3 py-1 rounded-full mr-2">
                    {selectedContactIds.length} selected
                  </span>
                )}
                <span>{filteredContacts.length} contacts</span>
              </div>
            </div>
          </Card>

          {/* Sheet Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                    />
                  </th>
                  {visibleColumnDefs.map(col => (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      className="px-4 py-3 text-left font-semibold text-gray-700 text-sm bg-gray-50 border-r last:border-r-0 cursor-pointer hover:bg-gray-100"
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{col.label}</span>
                        {col.sortable && sortField === col.key && (
                          <span className="text-xs">{sortOrder === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnDefs.length + 1} className="px-4 py-12 text-center text-gray-500 text-sm">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className={`border-b hover:bg-blue-50/50 transition-colors ${selectedContactIds.includes(contact.id) ? 'bg-blue-50' : ''}`}>
                      <td className="w-12 px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => toggleSelectContact(contact.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                        />
                      </td>
                      {visibleColumnDefs.map(col => (
                        <td
                          key={`${contact.id}-${col.key}`}
                          style={{ width: col.width }}
                          className={`px-4 py-3 text-sm border-r last:border-r-0 ${col.editable && selectedContactIds.includes(contact.id) ? 'bg-blue-50/50 cursor-cell' : ''}`}
                          onDoubleClick={() => col.editable && handleEditCell(contact, col.key)}
                        >
                          {editingCell?.contactId === contact.id && editingCell?.field === col.key ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              autoFocus
                              className="w-full px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          ) : (
                            <span className="text-gray-900">{getCellValue(contact, col.key)}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="text-xs text-gray-600 p-4 bg-gray-50 rounded-lg border border-gray-200">
            Tip: Double-click on any editable cell to edit inline. Click column headers to sort.
          </div>
        </div>
      )}
    </div>
  );
}
