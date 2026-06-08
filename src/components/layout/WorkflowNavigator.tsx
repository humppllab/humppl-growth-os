'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Sparkles, Trophy } from 'lucide-react'

const workflowSteps = [
  { name: 'Dashboard', path: '/', tip: 'Explore aggregate client health metrics, won deals, and scheduled meetings.' },
  { name: 'Organizations', path: '/organizations', tip: 'Start by creating client companies and registering their industry/website details.' },
  { name: 'Contacts', path: '/contacts', tip: 'Add individual stakeholders, decision-makers, and CHROs to your organizations.' },
  { name: 'Campaigns', path: '/campaigns', tip: 'Plan and run email campaigns to engage HR heads, CHROs, and campus placement coordinators.' },
  { name: 'Leads', path: '/leads', tip: 'Manage inbound marketing responses and qualify prospects before opportunity conversion.' },
  { name: 'Opportunities', path: '/opportunities', tip: 'Track active consulting, CHRO, or campus deals. Assign an owner and estimate value.' },
  { name: 'Pipeline Stages', path: '/pipeline', tip: 'Drag and drop your active deals across stages, from lead to negotiation and victory.' },
  { name: 'Meetings', path: '/meetings', tip: 'Schedule discover calls or kickoff sessions to keep deals warm and record timeline notes.' },
  { name: 'Follow-ups', path: '/follow-ups', tip: 'Assign checklist items and follow-ups with owners. Mark completed to clear outstanding tasks.' },
  { name: 'Proposals', path: '/proposals', tip: 'Draft official proposals, specify pricing models, and track proposal document statuses.' },
  { name: 'Approvals', path: '/approvals', tip: 'Request reviews for commercial terms, and approve or reject submissions.' },
  { name: 'Documents', path: '/documents', tip: 'Share and reference Google Drive links, presentation decks, or signed agreements.' },
  { name: 'Onboarding', path: '/onboarding', tip: 'Kick off delivery checklists for won accounts. Mark off scopes and kickoff terms.' },
  { name: 'Tickets', path: '/tickets', tip: 'Track post-onboarding client issues, service requests, and SLA response times.' },
  { name: 'Settings', path: '/settings', tip: 'Review your account workspace, profile settings, and internal company info.' }
]

export default function WorkflowNavigator() {
  const pathname = usePathname()
  const router = useRouter()

  const currentStepIndex = workflowSteps.findIndex(step => step.path === pathname)
  if (currentStepIndex === -1) return null // Hide on other pages like /login or subpages

  const currentStep = workflowSteps[currentStepIndex]
  const nextStep = currentStepIndex < workflowSteps.length - 1 ? workflowSteps[currentStepIndex + 1] : null
  const prevStep = currentStepIndex > 0 ? workflowSteps[currentStepIndex - 1] : null
  const progressPercent = Math.round(((currentStepIndex + 1) / workflowSteps.length) * 100)

  return (
    <div className="mt-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6 max-w-6xl mx-auto overflow-hidden animate-in fade-in duration-300">
      {/* Header and Progress Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold shrink-0">
            {currentStepIndex + 1}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm md:text-base">CRM Journey Progress</h4>
            <p className="text-xs text-gray-500 font-medium">Step {currentStepIndex + 1} of {workflowSteps.length}: {currentStep.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full shrink-0">
            {progressPercent}% Complete
          </span>
        </div>
      </div>

      {/* Progress Dots Visualizer */}
      <div className="relative pt-2 pb-4 hidden lg:block">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
        <div 
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{ width: `${(currentStepIndex / (workflowSteps.length - 1)) * 100}%` }}
        ></div>
        <div className="relative flex justify-between">
          {workflowSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex
            const isActive = idx === currentStepIndex
            return (
              <Link 
                key={step.name} 
                href={step.path}
                className="flex flex-col items-center group relative cursor-pointer"
              >
                <div 
                  className={`h-6 w-6 rounded-full flex items-center justify-center border-2 z-10 transition-all ${
                    isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                      : isActive 
                        ? 'bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50' 
                        : 'bg-white border-gray-200 text-gray-400 group-hover:border-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <span 
                  className={`absolute top-8 text-[10px] font-semibold tracking-tight transition-colors whitespace-nowrap opacity-60 group-hover:opacity-100 ${
                    isActive ? 'text-blue-700 font-bold opacity-100' : 'text-gray-500'
                  }`}
                >
                  {step.name}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tips and Interactive Description Banner */}
      <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4 flex gap-3 items-start">
        <Sparkles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-bold text-blue-700 block uppercase tracking-wider">Growth Tip</span>
          <p className="text-sm text-blue-900 font-medium mt-0.5 leading-relaxed">{currentStep.tip}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {prevStep ? (
            <Link href={prevStep.path}>
              <button className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back: {prevStep.name}
              </button>
            </Link>
          ) : (
            <div className="w-10"></div>
          )}
        </div>

        <div>
          {nextStep ? (
            <Link href={nextStep.path}>
              <button className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-xl text-white shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99]">
                Next: {nextStep.name} <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </Link>
          ) : (
            <Link href="/">
              <button className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold rounded-xl text-white shadow-sm hover:shadow transition-all hover:scale-[1.01] active:scale-[0.99]">
                Complete Workflow <Trophy className="ml-2 h-4 w-4" />
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
