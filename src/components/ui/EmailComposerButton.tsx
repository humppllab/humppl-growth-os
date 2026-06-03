'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Mail, X, Loader2, Search } from "lucide-react";
import { getContacts } from "@/actions";
import { PIPELINE_STAGES, OPPORTUNITY_TYPES, getEmailTemplate, openGmailCompose } from "@/lib/templates";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title: string;
  organizations?: {
    name: string;
  } | null;
}

export default function EmailComposerButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  
  // Form fields
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [selectedOppType, setSelectedOppType] = useState(OPPORTUNITY_TYPES[0]);
  const [selectedStage, setSelectedStage] = useState(PIPELINE_STAGES[0]);
  
  // Custom Subject & Body if user wants to override
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      async function loadContacts() {
        setLoading(true);
        try {
          const data = (await getContacts()) as Contact[];
          setContacts(data);
        } catch (err) {
          console.error("Failed to load contacts for composer:", err);
        } finally {
          setLoading(false);
        }
      }
      loadContacts();
    }
  }, [isOpen]);

  // Update form fields when a contact is selected
  const handleContactChange = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) {
      setRecipientEmail("");
      setClientName("");
      setCompanyName("");
      return;
    }
    const contact = contacts.find(c => c.id.toString() === contactId);
    if (contact) {
      setRecipientEmail(contact.email || "");
      setClientName(`${contact.first_name} ${contact.last_name}`.trim());
      setCompanyName(contact.organizations?.name || "");
    }
  };

  // Generate dynamic email draft template preview
  const activeTemplate = getEmailTemplate(
    selectedStage,
    clientName || "Client",
    companyName || "your organization",
    selectedOppType || "our solutions"
  );

  const finalSubject = isCustomMode ? customSubject : activeTemplate.subject;
  const finalBody = isCustomMode ? customBody : activeTemplate.body;

  // Initialize custom mode when user switches to Custom or types override
  useEffect(() => {
    if (isCustomMode && !customSubject && !customBody) {
      setCustomSubject(activeTemplate.subject);
      setCustomBody(activeTemplate.body);
    }
  }, [isCustomMode, activeTemplate, customSubject, customBody]);

  const handleSend = () => {
    openGmailCompose({ subject: finalSubject, body: finalBody }, recipientEmail);
    setIsOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 shadow-sm"
      >
        <Mail className="h-4 w-4" />
        <span>Compose Email</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-lg">Growth Email Composer</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column - Setup */}
                <div className="space-y-4">
                  {/* Contact Selection */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                      Select Linked Contact
                    </label>
                    {loading ? (
                      <div className="flex items-center gap-2 py-1">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span className="text-xs text-gray-500">Loading contacts...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedContactId}
                        onChange={(e) => handleContactChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">-- Choose Contact (or type details manually) --</option>
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.first_name} {c.last_name} ({c.organizations?.name || 'No Company'}) - {c.email}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Manual / Pre-filled details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-0.5">
                        Client Name
                      </label>
                      <input 
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. John Doe"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-0.5">
                        Company Name
                      </label>
                      <input 
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-1">
                      Recipient Email
                    </label>
                    <input 
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. client@domain.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Offering / Opportunity Type */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-1">
                      Business/Campus Offering
                    </label>
                    <select
                      value={selectedOppType}
                      onChange={(e) => setSelectedOppType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {OPPORTUNITY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  {/* Pipeline Stage template picker */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-1">
                      Email Template (Stage)
                    </label>
                    <select
                      value={selectedStage}
                      onChange={(e) => {
                        setSelectedStage(e.target.value);
                        setIsCustomMode(false);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium text-blue-600"
                    >
                      {PIPELINE_STAGES.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Column - Preview & Overrides */}
                <div className="flex flex-col border border-gray-200 rounded-xl bg-slate-50 p-4 h-full min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3 shrink-0">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Draft Preview</h4>
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={isCustomMode}
                        onChange={(e) => {
                          setIsCustomMode(e.target.checked);
                          if (e.target.checked) {
                            setCustomSubject(activeTemplate.subject);
                            setCustomBody(activeTemplate.body);
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
                      />
                      <span>Edit Mode</span>
                    </label>
                  </div>

                  {isCustomMode ? (
                    <div className="space-y-3 flex-1 flex flex-col">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Subject</label>
                        <input 
                          type="text"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-0.5">Body</label>
                        <textarea 
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                          className="w-full flex-1 p-2 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white resize-none min-h-[160px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col space-y-3 text-xs overflow-y-auto">
                      <div>
                        <span className="font-semibold text-gray-550 block">Subject:</span>
                        <div className="bg-white border rounded-md p-2 font-medium text-gray-800 border-gray-150">
                          {activeTemplate.subject}
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-semibold text-gray-550 block mb-1">Body:</span>
                        <div className="bg-white border rounded-md p-3 whitespace-pre-wrap text-gray-700 border-gray-150 flex-1 min-h-[160px]">
                          {activeTemplate.body}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!recipientEmail}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Mail className="h-4 w-4" />
                <span>Open in Gmail</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
