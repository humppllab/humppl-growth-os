'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CheckCircle2, Circle, Plus, X, Loader2 } from "lucide-react";
import { getOnboardingList, createOnboarding, toggleOnboardingTask, getOrganizations } from "@/actions";
import EmailComposerButton from "@/components/ui/EmailComposerButton";

interface Organization {
  id: number;
  name: string;
}

interface OnboardingTask {
  id: string;
  name: string;
  status: boolean;
}

interface OnboardingChecklist {
  id: string;
  organization_id: number;
  project: string;
  progress: number;
  organizations?: {
    name: string;
  } | null;
  onboarding_tasks: OnboardingTask[];
}

const DEFAULT_ONBOARDING_TASKS = [
  "Commercials approved",
  "Agreement shared",
  "Agreement signed",
  "Invoice raised",
  "Payment terms confirmed",
  "Kickoff meeting scheduled",
  "Client SPOC confirmed",
  "Internal owner assigned",
  "Scope locked",
  "Delivery timeline created",
  "Success metrics defined",
  "First delivery action scheduled"
];

export default function OnboardingPage() {
  const [checklists, setChecklists] = useState<OnboardingChecklist[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState("");
  const [project, setProject] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [obData, orgsData] = await Promise.all([
          getOnboardingList(),
          getOrganizations()
        ]);
        setChecklists(obData);
        setOrganizations(orgsData);
        if (orgsData.length > 0) {
          setOrganizationId(orgsData[0].id.toString());
        }
      } catch (err) {
        console.error("Failed to load onboarding data:", err);
        setError("Could not load onboarding checklist. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !project) return;
    setSubmitting(true);
    setError("");
    try {
      const orgId = parseInt(organizationId);
      const newOb = await createOnboarding(orgId, project, DEFAULT_ONBOARDING_TASKS);
      if (newOb) {
        // Reload list to get all tasks populated with IDs
        const obData = await getOnboardingList();
        setChecklists(obData);
        setIsModalOpen(false);
        setProject("");
      }
    } catch (err: any) {
      console.error("Failed to create onboarding:", err);
      setError("Failed to create onboarding checklist. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (checklistId: string, taskId: string, currentStatus: boolean) => {
    try {
      const res = await toggleOnboardingTask(taskId, currentStatus);
      if (res) {
        setChecklists(checklists.map(checklist => {
          if (checklist.id === checklistId) {
            return {
              ...checklist,
              progress: res.progress,
              onboarding_tasks: checklist.onboarding_tasks.map(t => 
                t.id === taskId ? { ...t, status: res.task.status } : t
              )
            };
          }
          return checklist;
        }));
      }
    } catch (err) {
      console.error("Failed to toggle onboarding task:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
          <p className="text-sm text-gray-500 mt-1">Track the onboarding progress of new clients and projects.</p>
        </div>
        <div className="flex items-center gap-3">
          <EmailComposerButton />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Start Onboarding
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
      ) : checklists.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center">
          <p className="text-gray-500 text-sm">No onboarding checklists started. Click "Start Onboarding" to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {checklists.map((checklist) => (
            <Card key={checklist.id} className="flex flex-col h-full shadow-sm hover:border-gray-300 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <CardTitle className="text-lg text-gray-900">{checklist.organizations?.name || '--'}</CardTitle>
                    <CardDescription className="mt-1">{checklist.project}</CardDescription>
                  </div>
                  <Badge variant={checklist.progress === 100 ? 'success' : 'default'}>
                    {checklist.progress}% Complete
                  </Badge>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${checklist.progress}%` }}
                  ></div>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-3 mt-2">
                  {checklist.onboarding_tasks?.map((task) => (
                    <button 
                      key={task.id} 
                      onClick={() => handleToggleTask(checklist.id, task.id, task.status)}
                      className="flex items-center w-full text-left focus:outline-none group"
                    >
                      {task.status ? (
                        <CheckCircle2 className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 group-hover:scale-105 transition-transform" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 mr-3 flex-shrink-0 group-hover:text-gray-400 group-hover:scale-105 transition-transform" />
                      )}
                      <span className={`text-sm ${task.status ? 'text-gray-900 line-through decoration-gray-300' : 'text-gray-600 group-hover:text-gray-800'}`}>
                        {task.name}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Start Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">Start Client Onboarding</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Project / Contract Name *</label>
                <input 
                  type="text" 
                  required
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. HR Transformation 2024" 
                  className="w-full px-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs space-y-1">
                <span className="font-semibold block">Includes Playbook Checklist:</span>
                <span>Initializing checklist with the 12 standard commercials, delivery, agreement, and invoice tasks.</span>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || !organizationId || !project}>
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-4 w-4" /> Starting...
                    </>
                  ) : "Start Onboarding"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
