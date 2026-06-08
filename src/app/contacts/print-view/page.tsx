'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Printer, Loader2, ArrowLeft, Check } from "lucide-react";
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

const PRINT_FIELDS = [
  { key: "first_name", label: "First Name", default: true },
  { key: "last_name", label: "Last Name", default: true },
  { key: "email", label: "Email", default: true },
  { key: "job_title", label: "Designation/Role", default: true },
  { key: "organization", label: "Organization", default: true },
  { key: "phone", label: "Phone", default: false },
  { key: "mobile", label: "Mobile", default: false },
];

export default function PrintViewPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedContactIds, setSelectedContactIds] = useState<number[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>(
    PRINT_FIELDS.filter(f => f.default).map(f => f.key)
  );
  const [printFormat, setPrintFormat] = useState<"list" | "cards">("list");

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

  const getContactsToPrint = () => {
    return selectedContactIds.length > 0
      ? filteredContacts.filter(c => selectedContactIds.includes(c.id))
      : filteredContacts;
  };

  const getFieldLabel = (key: string) => {
    return PRINT_FIELDS.find(f => f.key === key)?.label || key;
  };

  const getFieldValue = (contact: Contact, field: string) => {
    if (field === "first_name") return contact.first_name;
    if (field === "last_name") return contact.last_name;
    if (field === "email") return contact.email;
    if (field === "job_title") return parseJobTitle(contact.job_title);
    if (field === "organization") return contact.organizations?.name || "--";
    if (field === "phone") return contact.phone || "--";
    if (field === "mobile") return contact.mobile || "--";
    return "";
  };

  const contactsToPrint = getContactsToPrint();

  const handlePrint = () => {
    window.print();
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
          <h1 className="text-2xl font-bold text-gray-900">Print Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Preview and print your contacts with customized field selection.</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Options Panel */}
          <Card className="lg:col-span-1 print:hidden">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Print Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {/* Print Format */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 pb-2 border-b">Format</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="list"
                      checked={printFormat === "list"}
                      onChange={(e) => setPrintFormat("list" as const)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">List View</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="cards"
                      checked={printFormat === "cards"}
                      onChange={(e) => setPrintFormat("cards" as const)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">Card View</span>
                  </label>
                </div>
              </div>

              {/* Fields Selection */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 pb-2 border-b">Fields</h3>
                <div className="space-y-2">
                  {PRINT_FIELDS.map(field => (
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
              </div>

              {/* Contacts Selection */}
              <div>
                <h3 className="text-xs font-bold text-gray-700 uppercase mb-3 pb-2 border-b">Contacts</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedContactIds.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-gray-700">All ({filteredContacts.length})</span>
                  </label>
                  <div className="text-xs text-gray-600 ml-7">
                    {selectedContactIds.length > 0 ? `${selectedContactIds.length} selected` : "Select all"}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900 space-y-1">
                <p><strong>Print Summary:</strong></p>
                <p>{contactsToPrint.length} contacts</p>
                <p>{selectedFields.length} fields</p>
                <p>Format: {printFormat === "list" ? "List" : "Cards"}</p>
              </div>

              {/* Print Button */}
              <Button
                onClick={handlePrint}
                className="w-full"
                disabled={contactsToPrint.length === 0 || selectedFields.length === 0}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </CardContent>
          </Card>

          {/* Print Preview */}
          <div className="lg:col-span-2">
            {printFormat === "list" ? (
              /* List View */
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden print:border-0 print:rounded-0">
                {/* Header for print */}
                <div className="p-6 bg-gray-50 border-b print:bg-white">
                  <h2 className="text-2xl font-bold text-gray-900">Contact Report</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Generated on {new Date().toLocaleDateString()} • Total: {contactsToPrint.length} contacts
                  </p>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 print:bg-gray-50">
                      <tr className="border-b">
                        {selectedFields.map(field => (
                          <th
                            key={field}
                            className="px-4 py-3 text-left font-semibold text-gray-900 text-sm print:text-xs"
                          >
                            {getFieldLabel(field)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {contactsToPrint.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50 print:hover:bg-white">
                          {selectedFields.map(field => (
                            <td
                              key={`${contact.id}-${field}`}
                              className="px-4 py-3 text-gray-900 text-sm print:text-xs print:py-2"
                            >
                              {getFieldValue(contact, field)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-6">
                {contactsToPrint.map((contact) => (
                  <Card key={contact.id} className="print:page-break-inside-avoid print:break-inside-avoid">
                    <CardContent className="p-4 print:p-6">
                      <div className="space-y-3">
                        {selectedFields.includes("first_name") && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Name</p>
                            <p className="text-lg font-bold text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </p>
                          </div>
                        )}

                        {selectedFields.includes("email") && contact.email && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                            <p className="text-sm text-gray-700 break-all">{contact.email}</p>
                          </div>
                        )}

                        {selectedFields.includes("job_title") && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Designation</p>
                            <p className="text-sm text-gray-700">{parseJobTitle(contact.job_title) || "--"}</p>
                          </div>
                        )}

                        {selectedFields.includes("organization") && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Organization</p>
                            <p className="text-sm text-gray-700">{contact.organizations?.name || "--"}</p>
                          </div>
                        )}

                        {selectedFields.includes("phone") && contact.phone && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Phone</p>
                            <p className="text-sm text-gray-700">{contact.phone}</p>
                          </div>
                        )}

                        {selectedFields.includes("mobile") && contact.mobile && (
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase">Mobile</p>
                            <p className="text-sm text-gray-700">{contact.mobile}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb !important;
          }
          .print\\:page-break-inside-avoid {
            page-break-inside: avoid;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:text-xs {
            font-size: 0.75rem;
          }
          .print\\:py-2 {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }
          .print\\:p-6 {
            padding: 1.5rem;
          }
          .print\\:hover\\:bg-white:hover {
            background-color: white !important;
          }
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #ccc;
          }
        }
      `}</style>
    </div>
  );
}
