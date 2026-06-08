'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Download, FileText, Loader2, ArrowLeft, Check, X } from "lucide-react";
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

const EXPORT_FIELDS = [
  { key: "first_name", label: "First Name", default: true },
  { key: "last_name", label: "Last Name", default: true },
  { key: "email", label: "Email", default: true },
  { key: "job_title", label: "Designation/Role", default: true },
  { key: "organization", label: "Organization", default: true },
  { key: "phone", label: "Phone", default: false },
  { key: "mobile", label: "Mobile", default: false },
  { key: "created_at", label: "Created Date", default: false },
];

type ExportFormat = "csv" | "xlsx";

export default function ExportContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [exportType, setExportType] = useState<"all" | "selected">("all");
  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    EXPORT_FIELDS.filter(f => f.default).map(f => f.key)
  );

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

  const toggleField = (fieldKey: string) => {
    if (selectedFields.includes(fieldKey)) {
      setSelectedFields(selectedFields.filter(f => f !== fieldKey));
    } else {
      setSelectedFields([...selectedFields, fieldKey]);
    }
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

  const selectAllFields = () => {
    setSelectedFields(EXPORT_FIELDS.map(f => f.key));
  };

  const deselectAllFields = () => {
    setSelectedFields([]);
  };

  const getContactsToExport = () => {
    return exportType === "all" ? filteredContacts : filteredContacts.filter(c => selectedContactIds.includes(c.id));
  };

  const prepareData = () => {
    const contactsToExport = getContactsToExport();
    
    return contactsToExport.map(contact => {
      const row: any = {};
      selectedFields.forEach(field => {
        if (field === "first_name") row[field] = contact.first_name || "";
        else if (field === "last_name") row[field] = contact.last_name || "";
        else if (field === "email") row[field] = contact.email || "";
        else if (field === "job_title") row[field] = parseJobTitle(contact.job_title);
        else if (field === "organization") row[field] = contact.organizations?.name || "";
        else if (field === "phone") row[field] = contact.phone || "";
        else if (field === "mobile") row[field] = contact.mobile || "";
        else if (field === "created_at") row[field] = new Date(contact.created_at).toLocaleDateString();
      });
      return row;
    });
  };

  const handleExportCSV = () => {
    setExporting(true);
    try {
      const data = prepareData();
      
      if (data.length === 0) {
        setError("No contacts to export. Select contacts and try again.");
        setExporting(false);
        return;
      }

      // Create CSV content
      const headers = selectedFields.map(f => EXPORT_FIELDS.find(ef => ef.key === f)?.label || f);
      const csvContent = [
        headers.join(","),
        ...data.map(row => 
          selectedFields.map(field => {
            const value = row[field];
            // Escape quotes and wrap in quotes if contains comma
            return `"${(value || "").toString().replace(/"/g, '""')}"`;
          }).join(",")
        )
      ].join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `contacts-export-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(`Successfully exported ${data.length} contact(s) as CSV`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError("Failed to export CSV: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportXLSX = () => {
    setError("XLSX export coming soon. Use CSV for now.");
  };

  const contactsToExport = getContactsToExport();

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
          <h1 className="text-2xl font-bold text-gray-900">Export Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Download your contacts in CSV or XLSX format with selected fields.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
          <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100 flex items-start gap-3">
          <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Options Panel */}
          <Card className="lg:col-span-1">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Export Type */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 pb-2 border-b">Contacts to Export</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportType"
                      value="all"
                      checked={exportType === "all"}
                      onChange={(e) => setExportType("all" as const)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      All Contacts <span className="text-gray-500">({filteredContacts.length})</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="exportType"
                      value="selected"
                      checked={exportType === "selected"}
                      onChange={(e) => setExportType("selected" as const)}
                      disabled={filteredContacts.length === 0}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">
                      Selected <span className="text-gray-500">({selectedContactIds.length})</span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Export Format */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 pb-2 border-b">File Format</h3>
                <div className="space-y-2">
                  <Button
                    onClick={handleExportCSV}
                    disabled={exporting || selectedFields.length === 0 || contactsToExport.length === 0}
                    className="w-full justify-start"
                  >
                    {exporting ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-2" />
                    )}
                    Export as CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportXLSX}
                    className="w-full justify-start"
                  >
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Export as XLSX
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
                <p><strong>Ready to export:</strong></p>
                <p>{contactsToExport.length} contacts × {selectedFields.length} fields</p>
              </div>
            </CardContent>
          </Card>

          {/* Main Panel: Contacts & Fields Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Field Selection */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Fields to Include</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllFields}
                      className="text-xs"
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAllFields}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  {EXPORT_FIELDS.map(field => (
                    <label key={field.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFields.includes(field.key)}
                        onChange={() => toggleField(field.key)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">{field.label}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contacts Selection (if selected export type) */}
            {exportType === "selected" && (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Select Contacts</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                      className="text-xs"
                    >
                      {selectedContactIds.length === filteredContacts.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-96 overflow-y-auto">
                    {filteredContacts.map(contact => (
                      <label
                        key={contact.id}
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(contact.id)}
                          onChange={() => toggleSelectContact(contact.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-gray-600">{contact.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export All Contacts Preview */}
            {exportType === "all" && (
              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-base">Preview ({filteredContacts.length} contacts)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {selectedFields.map(field => (
                            <th key={field} className="px-4 py-2 text-left font-semibold text-gray-700">
                              {EXPORT_FIELDS.find(f => f.key === field)?.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredContacts.slice(0, 5).map(contact => (
                          <tr key={contact.id} className="hover:bg-gray-50">
                            {selectedFields.map(field => (
                              <td key={`${contact.id}-${field}`} className="px-4 py-2 text-gray-600">
                                {field === "first_name" && contact.first_name}
                                {field === "last_name" && contact.last_name}
                                {field === "email" && contact.email}
                                {field === "job_title" && parseJobTitle(contact.job_title)}
                                {field === "organization" && contact.organizations?.name}
                                {field === "phone" && (contact.phone || "--")}
                                {field === "mobile" && (contact.mobile || "--")}
                                {field === "created_at" && new Date(contact.created_at).toLocaleDateString()}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredContacts.length > 5 && (
                      <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-600">
                        ... and {filteredContacts.length - 5} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
