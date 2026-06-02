'use client'

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";
import { getOpportunities, updateOpportunityStage } from "@/actions";
import { formatRupees } from "@/lib/utils";

interface Opportunity {
  id: string;
  name: string;
  stage: string;
  value: number;
  organizations?: {
    name: string;
  } | null;
}

const PIPELINE_STAGES = [
  "New Lead",
  "Qualified",
  "Meeting Booked",
  "Discovery Done",
  "Solution Mapped",
  "Proposal Draft",
  "Proposal Sent",
  "Follow-Up Active",
  "Negotiation",
  "Approval Pending",
  "Won",
  "Lost",
  "Nurture"
];

export default function PipelinePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const oppsData = await getOpportunities();
        setOpportunities(oppsData);
      } catch (err) {
        console.error("Failed to load pipeline data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

  // Build column structures dynamically
  const columns = PIPELINE_STAGES.map(stage => {
    const deals = opportunities.filter(opp => opp.stage === stage);
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
                          <div className="mt-3 text-sm font-semibold text-blue-600">
                            {formatRupees(deal.value)}
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
    </div>
  );
}
