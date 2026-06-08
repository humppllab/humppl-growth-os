'use client'

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2, Mail, Calendar, X } from "lucide-react";
import { getOpportunities, updateOpportunityStage, createMeeting } from "@/actions";
import { formatRupees } from "@/lib/utils";
import { PIPELINE_STAGES, getEmailTemplate, openGmailCompose } from "@/lib/templates";

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  value: number;
  type?: string;
  organization_id?: number;
  organizations?: {
    name: string;
    contacts?: Array<{
      id: number;
      first_name: string;
      last_name: string;
      email: string;
      job_title: string;
    }>;
  } | null;
}

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Scheduling Modal State
  const [selectedDealForMeeting, setSelectedDealForMeeting] = useState<Opportunity | null>(null);
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDateTime, setMeetingDateTime] = useState("");
  const [meetingError, setMeetingError] = useState("");
  const [submittingMeeting, setSubmittingMeeting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const oppsData = (await getOpportunities()) as Opportunity[];
        setOpportunities(oppsData);
      } catch (err) {
        console.error("Failed to load pipeline data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Update default meeting title when a deal is selected
  useEffect(() => {
    if (selectedDealForMeeting) {
      setMeetingTitle(`${selectedDealForMeeting.stage} with ${selectedDealForMeeting.organizations?.name || 'Client'}`);
      setMeetingDateTime("");
      setMeetingError("");
    }
  }, [selectedDealForMeeting]);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    e.dataTransfer.setData("text/plain", oppId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData("text/plain");
    if (!oppId) return;

    // Find current opportunity stage
    const oppObj = opportunities.find(o => o.id === oppId);
    if (!oppObj || oppObj.stage === targetStage) return;

    // Optimistically update UI state
    const originalOpps = [...opportunities];
    setOpportunities(opportunities.map(o => o.id === oppId ? { ...o, stage: targetStage } : o));
    setUpdatingId(oppId);

    try {
      await updateOpportunityStage(oppId, targetStage);
    } catch (err) {
      console.error("Failed to update stage:", err);
      // Revert state on error
      setOpportunities(originalOpps);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEmailClick = (deal: Opportunity) => {
    const contacts = deal.organizations?.contacts || [];
    const contact = contacts[0];
    const clientName = contact ? `${contact.first_name} ${contact.last_name}` : "Client";
    const clientEmail = contact ? contact.email : "";
    const companyName = deal.organizations?.name || "your organization";
    
    const template = getEmailTemplate(deal.stage, clientName, companyName, deal.type || "our solutions");
    openGmailCompose(template, clientEmail);
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDealForMeeting) return;
    const orgId = selectedDealForMeeting.organization_id;
    if (!orgId) {
      setMeetingError("This opportunity is not linked to any organization.");
      return;
    }
    setSubmittingMeeting(true);
    try {
      await createMeeting(meetingTitle, orgId, meetingDateTime);
      setSelectedDealForMeeting(null);
      setMeetingError("Meeting scheduled successfully.");
    } catch (err: any) {
      console.error(err);
      setMeetingError(err.message || "Failed to schedule meeting.");
    } finally {
      setSubmittingMeeting(false);
    }
  };

  // Build column structures dynamically
  const columns = PIPELINE_STAGES.map(stage => {
    const deals = opportunities.filter(opp => {
      let currentStage = opp.stage;
      if (!PIPELINE_STAGES.includes(currentStage)) {
        if (currentStage === "New Lead") currentStage = "Introductory Email";
        else if (currentStage === "Qualified" || currentStage === "Meeting Booked") currentStage = "1st Meeting";
        else if (currentStage === "Discovery Done") currentStage = "2nd Meeting";
        else if (currentStage === "Solution Mapped" || currentStage === "Proposal Draft") currentStage = "Technical Proposal";
        else if (currentStage === "Proposal Sent") currentStage = "Commercial Proposal";
        else if (currentStage === "Follow-Up Active") currentStage = "4th Meeting";
        else if (currentStage === "Negotiation") currentStage = "Negotiations";
        else if (currentStage === "Approval Pending") currentStage = "SLA Sent";
        else if (currentStage === "Won") currentStage = "SLA Signed";
        else if (currentStage === "Lost") currentStage = "Internal Handover to Delivery";
        else currentStage = "Introductory Email"; // Default fallback
      }
      return currentStage === stage;
    });
    return {
      name: stage,
      deals
    };
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop opportunities across stages.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 flex-1">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-[calc(100vh-200px)] min-w-max">
            {columns.map((column) => (
              <div 
                key={column.name} 
                className="w-80 flex flex-col bg-gray-50/80 rounded-xl border border-gray-200 shadow-sm"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.name)}
              >
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl shrink-0">
                  <h3 className="font-semibold text-gray-700 text-sm">{column.name}</h3>
                  <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">
                    {column.deals.length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {column.deals.map((deal) => (
                    <div 
                      key={deal.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, deal.id)}
                      className={`cursor-grab active:cursor-grabbing hover:border-blue-300 transition-colors ${updatingId === deal.id ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <Card className="shadow-sm">
                        <CardContent className="p-4">
                          <h4 className="font-medium text-gray-900 text-sm">{deal.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{deal.organizations?.name || '--'}</p>
                          <div className="mt-2 text-sm font-semibold text-blue-600">
                            {formatRupees(deal.value)}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmailClick(deal);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Compose pre-templated Gmail discussion"
                            >
                              <Mail className="h-3 w-3" />
                              <span>Email</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDealForMeeting(deal);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Schedule next stage meeting"
                            >
                              <Calendar className="h-3 w-3" />
                              <span>Schedule</span>
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                  {column.deals.length === 0 && (
                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400">
                      Drop here
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {selectedDealForMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h3 className="font-semibold text-gray-950">Schedule Meeting</h3>
              <button 
                onClick={() => setSelectedDealForMeeting(null)} 
                className="text-gray-400 hover:text-gray-650 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-1">
                  Meeting Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-550 mb-1">
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={meetingDateTime}
                  onChange={(e) => setMeetingDateTime(e.target.value)}
                />
              </div>
              
              {meetingError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{meetingError}</p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedDealForMeeting(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMeeting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingMeeting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
