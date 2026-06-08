'use server'

import { createClient } from '@supabase/supabase-js'
import { formatRupees } from './lib/utils'
import { cookies } from 'next/headers'

// ==========================================
// SUPABASE CLIENT HELPER (SESSION-AWARE)
// ==========================================
async function getSupabaseClient() {
  const cookieStore = await cookies()
  const token = cookieStore.get('sb-access-token')?.value
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    }
  )
}

// ==========================================
// ACTIVITY LOGS ACTIONS
// ==========================================
export async function logActivity(
  title: string,
  description: string = '',
  type: string,
  opportunityId?: string,
  organizationId?: number,
  contactId?: number
) {
  const supabase = await getSupabaseClient()
  const record: any = { title, description, type }
  if (opportunityId) record.opportunity_id = opportunityId
  if (organizationId) record.organization_id = organizationId
  if (contactId) record.contact_id = contactId

  const { data, error } = await supabase
    .from('activity_logs')
    .insert([record])
    .select()

  if (error) {
    console.error("Activity logging failed:", error.message)
  }
  return data
}

export async function getActivityTimeline(
  opportunityId?: string,
  organizationId?: number,
  contactId?: number
) {
  const supabase = await getSupabaseClient()
  let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false })
  if (opportunityId) query = query.eq('opportunity_id', opportunityId)
  if (organizationId) query = query.eq('organization_id', organizationId)
  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

// ==========================================
// ORGANIZATIONS ACTIONS
// ==========================================
export async function getOrganizations() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createOrganization(name: string, industry: string, websiteUrl: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('organizations')
    .insert([{ name, industry, website_url: websiteUrl }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Organization Added',
      `Created organization: ${name}`,
      'organization_created',
      undefined,
      data[0].id
    )
  }
  return data ? data[0] : null
}

// ==========================================
// CONTACTS ACTIONS
// ==========================================
export async function getContacts() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('*, organizations(id, name)')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createContact(
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
  organizationId: number
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('contacts')
    .insert([{ first_name: firstName, last_name: lastName, email, job_title: jobTitle, organization_id: organizationId }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Contact Added',
      `Created contact: ${firstName} ${lastName} (${jobTitle})`,
      'contact_created',
      undefined,
      organizationId,
      data[0].id
    )
  }
  return data ? data[0] : null
}

export async function createContactWithOrgOnly(
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
  organizationName: string,
  organizationIndustry: string,
  organizationWebsite: string,
  noteContent: string,
  createdBy: string
) {
  const supabase = await getSupabaseClient()
  let orgId: number
  const { data: existingOrgs, error: findError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', organizationName)
    .limit(1)

  if (findError) throw new Error(findError.message)

  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: organizationName, industry: organizationIndustry, website_url: organizationWebsite }])
      .select()
    if (orgError) throw new Error(orgError.message)
    orgId = newOrg[0].id
  }

  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert([{ first_name: firstName, last_name: lastName, email, job_title: jobTitle, organization_id: orgId }])
    .select()

  if (contactError) throw new Error(contactError.message)
  const contact = newContact[0]

  if (noteContent && contact) {
    await createNote(noteContent, undefined, orgId, contact.id, createdBy || 'System')
  }

  if (contact) {
    await logActivity(
      'Contact Added',
      `Created contact: ${firstName} ${lastName}`,
      'contact_created',
      undefined,
      orgId,
      contact.id
    )
  }

  return contact
}

export async function updateContact(
  contactId: number,
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
  organizationName: string,
  organizationIndustry: string,
  organizationWebsite: string,
  createdBy: string,
  modifiedBy: string
) {
  const supabase = await getSupabaseClient()
  let orgId: number
  const { data: existingOrgs, error: findError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', organizationName)
    .limit(1)

  if (findError) throw new Error(findError.message)

  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: organizationName, industry: organizationIndustry, website_url: organizationWebsite }])
      .select()
    if (orgError) throw new Error(orgError.message)
    orgId = newOrg[0].id
  }

  const { data, error } = await supabase
    .from('contacts')
    .update({ first_name: firstName, last_name: lastName, email, job_title: jobTitle, organization_id: orgId })
    .eq('id', contactId)
    .select()

  if (error) throw new Error(error.message)

  if (data && data[0]) {
    const updateNote = `Contact updated by ${modifiedBy || createdBy}.`;
    await createNote(updateNote, undefined, orgId, contactId, modifiedBy || createdBy)
    await logActivity(
      'Contact Updated',
      `Updated contact: ${firstName} ${lastName}`,
      'contact_updated',
      undefined,
      orgId,
      contactId
    )
  }

  return data ? data[0] : null
}

export async function deleteContact(contactId: number) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('contacts')
    .update({ archived: true })
    .eq('id', contactId)
    .select()

  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// OPPORTUNITIES ACTIONS
// ==========================================
export async function getOpportunities() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, organizations(name, contacts(*))')
    .eq('archived', false)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createOpportunity(
  name: string,
  organizationId: number,
  type: string,
  stage: string,
  value: number,
  owner: string
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .insert([{ name, organization_id: organizationId, type, stage, value, owner }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Opportunity Created',
      `New opportunity: ${name} (Value: ${formatRupees(value)})`,
      'opportunity_created',
      data[0].id,
      organizationId
    )
  }
  return data ? data[0] : null
}

export async function updateOpportunityStage(id: string, stage: string) {
  const supabase = await getSupabaseClient()
  const { data: oppBefore, error: fetchErr } = await supabase
    .from('opportunities')
    .select('stage, name, organization_id')
    .eq('id', id)
    .single()

  if (fetchErr) throw new Error(fetchErr.message)

  const { data, error } = await supabase
    .from('opportunities')
    .update({ stage })
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)

  if (oppBefore && oppBefore.stage !== stage) {
    await logActivity(
      'Opportunity Stage Updated',
      `Moved "${oppBefore.name}" from ${oppBefore.stage} to ${stage}`,
      'stage_updated',
      id,
      oppBefore.organization_id
    )

    // Trigger auto-onboarding checklist if stage is Won
    if (stage === 'Won' || stage === 'SLA Signed') {
      try {
        await createOnboarding(oppBefore.organization_id, `Project for ${oppBefore.name}`, [
          'Agreement Status Check',
          'Kickoff Timeline Set',
          'Scope Alignment locked',
          'Invoice Generated'
        ], id)
      } catch (err) {
        console.error("Auto onboarding checklist generation failed:", err)
      }
    }
  }
  return data ? data[0] : null
}

// ==========================================
// MEETINGS ACTIONS
// ==========================================
export async function getMeetings() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('meetings')
    .select('*, organizations(name)')
    .order('date_time', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createMeeting(
  title: string,
  organizationId: number,
  dateTimeStr: string,
  status: string = 'Scheduled'
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('meetings')
    .insert([{ title, organization_id: organizationId, date_time: dateTimeStr, status }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Meeting Scheduled',
      `Scheduled meeting: "${title}" on ${new Date(dateTimeStr).toLocaleString()}`,
      'meeting_scheduled',
      undefined,
      organizationId
    )
  }
  return data ? data[0] : null
}

export async function updateMeetingDateTime(id: string, dateTimeStr: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('meetings')
    .update({ date_time: dateTimeStr })
    .eq('id', id)
    .select()

  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Meeting Rescheduled',
      `Rescheduled meeting: "${data[0].title}" to ${new Date(dateTimeStr).toLocaleString()}`,
      'meeting_scheduled',
      undefined,
      data[0].organization_id
    )
  }

  return data ? data[0] : null
}

// ==========================================
// FOLLOW-UPS ACTIONS
// ==========================================
export async function getFollowUps() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('followups')
    .select('*, organizations(name)')
    .order('date', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createFollowUp(
  organizationId: number,
  dateStr: string,
  owner: string,
  status: string = 'Pending'
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('followups')
    .insert([{ organization_id: organizationId, date: dateStr, owner, status }])
    .select()
  if (error) throw new Error(error.message)
  
  if (data && data[0]) {
    await logActivity(
      'Follow-up Task Added',
      `Created follow-up for owner ${owner} by ${new Date(dateStr).toLocaleDateString()}`,
      'follow_up_created',
      undefined,
      organizationId
    )
  }
  return data ? data[0] : null
}

export async function toggleFollowUpStatus(id: string, currentStatus: string) {
  const supabase = await getSupabaseClient()
  const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed'
  const { data, error } = await supabase
    .from('followups')
    .update({ status: nextStatus })
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// PROPOSALS & APPROVALS ACTIONS
// ==========================================
export async function getProposals() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('proposals')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createProposal(
  title: string,
  organizationId: number,
  value: number,
  status: string = 'Draft',
  dateSentStr?: string,
  opportunityId?: string,
  discountPercentage?: number
) {
  const supabase = await getSupabaseClient()
  const record: any = { title, organization_id: organizationId, value, status }
  if (dateSentStr) record.date_sent = dateSentStr
  if (opportunityId) record.opportunity_id = opportunityId

  const { data, error } = await supabase
    .from('proposals')
    .insert([record])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    const proposal = data[0]
    await logActivity(
      'Proposal Created',
      `Proposal "${title}" created (Value: ${formatRupees(value)})`,
      'proposal_created',
      opportunityId,
      organizationId
    )

    // Trigger auto approval if discount is over 15%
    if (discountPercentage && discountPercentage > 15) {
      try {
        await createApproval(
          `Discount Approval for ${title}`,
          organizationId,
          value,
          'Pending',
          proposal.id,
          opportunityId,
          `Requested discount of ${discountPercentage}% exceeds the 15% threshold.`
        )
      } catch (err) {
        console.error("Auto approval request creation failed:", err)
      }
    }
  }
  return data ? data[0] : null
}

export async function getApprovals() {
  const supabase = await getSupabaseClient()
  const { data: approvals, error } = await supabase
    .from('approval_requests')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  
  if (!approvals || approvals.length === 0) return []

  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name')

  if (orgsError) {
    console.error("Error mapping organizations:", orgsError.message)
    return approvals.map(app => ({ ...app, organizations: null }))
  }

  const orgMap = new Map(orgs.map(o => [o.id, o.name]))
  return approvals.map(app => ({
    ...app,
    organizations: app.organization_id ? { name: orgMap.get(app.organization_id) || null } : null
  }))
}

export async function createApproval(
  title: string,
  organizationId: number,
  value: number,
  status: string = 'Pending',
  proposalId?: string,
  opportunityId?: string,
  reason?: string
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('approval_requests')
    .insert([{ title, organization_id: organizationId, requested_value: value, status, proposal_id: proposalId, opportunity_id: opportunityId, reason }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Approval Requested',
      `Requested approval for "${title}" (Value: ${formatRupees(value)})`,
      'approval_requested',
      opportunityId,
      organizationId
    )
  }
  return data ? data[0] : null
}

export async function updateApprovalStatus(id: string, status: string, notes?: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('approval_requests')
    .update({ status, decision_notes: notes })
    .eq('id', id)
    .select('*')
  if (error) throw new Error(error.message)

  if (!data || data.length === 0) return null

  const approval = data[0]
  let orgName = null

  if (approval.organization_id) {
    const { data: orgData } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', approval.organization_id)
      .single()
    if (orgData) orgName = orgData.name
  }

  const result = {
    ...approval,
    organizations: orgName ? { name: orgName } : null
  }

  await logActivity(
    'Approval Status Updated',
    `Approval for "${result.title}" was ${status}`,
    'approval_status_updated',
    approval.opportunity_id,
    result.organization_id
  )

  // Update linked proposal status if approved
  if (approval.proposal_id && status === 'Approved') {
    await supabase.from('proposals').update({ status: 'Approved' }).eq('id', approval.proposal_id)
  }

  return result
}

// ==========================================
// DOCUMENTS ACTIONS
// ==========================================
export async function getDocuments() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('documents_shared')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createDocument(
  name: string,
  type: string,
  organizationId: number,
  fileUrl?: string,
  size: string = '--',
  opportunityId?: string,
  proposalId?: string
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('documents_shared')
    .insert([{ name, type, organization_id: organizationId, file_url: fileUrl, size, opportunity_id: opportunityId, proposal_id: proposalId }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Document Uploaded',
      `Uploaded document "${name}" (${type})`,
      'document_uploaded',
      opportunityId,
      organizationId
    )
  }
  return data ? data[0] : null
}

// ==========================================
// ONBOARDING ACTIONS
// ==========================================
export async function getOnboardingList() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('onboarding_checklists')
    .select('*, organizations(name), onboarding_tasks(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createOnboarding(
  organizationId: number,
  project: string,
  tasks: string[] = [],
  opportunityId?: string
) {
  const supabase = await getSupabaseClient()
  const record: any = { organization_id: organizationId, project, progress: 0 }
  if (opportunityId) record.opportunity_id = opportunityId

  // Insert onboarding record
  const { data: obData, error: obError } = await supabase
    .from('onboarding_checklists')
    .insert([record])
    .select()
  if (obError) throw new Error(obError.message)

  const ob = obData ? obData[0] : null
  if (ob && tasks.length > 0) {
    const taskRecords = tasks.map(t => ({
      onboarding_id: ob.id,
      name: t,
      status: false
    }))
    const { error: tasksError } = await supabase
      .from('onboarding_tasks')
      .insert(taskRecords)
    if (tasksError) throw new Error(tasksError.message)
  }

  if (ob) {
    await logActivity(
      'Client Onboarding Started',
      `Started onboarding for project: "${project}"`,
      'onboarding_started',
      opportunityId,
      organizationId
    )
  }

  return ob
}

export async function toggleOnboardingTask(taskId: string, currentStatus: boolean) {
  const supabase = await getSupabaseClient()
  const nextStatus = !currentStatus
  const { data: taskData, error: taskError } = await supabase
    .from('onboarding_tasks')
    .update({ status: nextStatus })
    .eq('id', taskId)
    .select('*, onboarding_checklists(id, progress, organization_id, opportunity_id, project)')
    .single()

  if (taskError) throw new Error(taskError.message)

  const onboardingId = taskData.onboarding_id
  const { data: allTasks, error: fetchTasksError } = await supabase
    .from('onboarding_tasks')
    .select('status')
    .eq('onboarding_id', onboardingId)

  if (fetchTasksError) throw new Error(fetchTasksError.message)

  const total = allTasks.length
  const completed = allTasks.filter(t => t.status).length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  await supabase
    .from('onboarding_checklists')
    .update({ progress })
    .eq('id', onboardingId)

  return { task: taskData, progress }
}

// ==========================================
// PROFILE ACTIONS
// ==========================================
export async function getProfile() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('profile_settings')
    .select('*')
    .limit(1)
  if (error) throw new Error(error.message)
  return data && data[0] ? data[0] : null
}

export async function updateProfile(
  firstName: string,
  lastName: string,
  email: string,
  companyName: string
) {
  const supabase = await getSupabaseClient()
  const profile = await getProfile()
  if (profile) {
    const { data, error } = await supabase
      .from('profile_settings')
      .update({ first_name: firstName, last_name: lastName, email, company_name: companyName, updated_at: new Date().toISOString() })
      .eq('id', profile.id)
      .select()
    if (error) throw new Error(error.message)
    return data ? data[0] : null
  } else {
    const { data, error } = await supabase
      .from('profile_settings')
      .insert([{ first_name: firstName, last_name: lastName, email, company_name: companyName }])
      .select()
    if (error) throw new Error(error.message)
    return data ? data[0] : null
  }
}

// ==========================================
// DASHBOARD METRICS ACTIONS
// ==========================================
export async function getDashboardMetrics() {
  const supabase = await getSupabaseClient()
  const [
    { count: orgsCount },
    { count: contactsCount },
    { data: opportunities },
    { data: meetings },
    { data: approvals },
    { data: recentActivities }
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('archived', false),
    supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('archived', false),
    supabase.from('opportunities').select('stage, value').eq('archived', false),
    supabase.from('meetings').select('id, date_time'),
    supabase.from('approval_requests').select('id, status'),
    supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(6)
  ])

  const activeOpps = (opportunities || []).filter(opp => 
    !['Won', 'Lost', 'Nurture'].includes(opp.stage)
  ).length

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)
  const meetingsToday = (meetings || []).filter(meet => {
    const d = new Date(meet.date_time)
    return d >= startOfDay && d <= endOfDay
  }).length

  const pendingApprovals = (approvals || []).filter(app => app.status === 'Pending').length
  const wonDeals = (opportunities || []).filter(opp => opp.stage === 'Won').length

  const stagesOfInterest = ['Discovery Done', 'Proposal Sent', 'Negotiation', 'Approval Pending']
  const pipelineSummary = stagesOfInterest.map((stage, idx) => {
    const oppsInStage = (opportunities || []).filter(opp => opp.stage === stage)
    const count = oppsInStage.length
    const totalVal = oppsInStage.reduce((sum, opp) => sum + (Number(opp.value) || 0), 0)
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500']
    
    return {
      stage,
      count,
      value: formatRupees(totalVal),
      color: colors[idx % colors.length]
    }
  })

  const formattedActivities = (recentActivities || []).map(act => {
    const diffMs = Date.now() - new Date(act.created_at).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    
    let timeStr = 'Just now'
    if (diffHours > 24) {
      timeStr = new Date(act.created_at).toLocaleDateString()
    } else if (diffHours > 0) {
      timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffMins > 0) {
      timeStr = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    }

    return {
      title: act.title,
      time: timeStr,
      type: act.type
    }
  })

  return {
    totalOrganizations: orgsCount || 0,
    totalContacts: contactsCount || 0,
    activeOpportunities: activeOpps,
    meetingsToday,
    pendingApprovals,
    wonDeals,
    pipelineSummary,
    recentActivities: formattedActivities
  }
}

// ==========================================
// NOTES ACTIONS
// ==========================================
export async function getNotes(
  opportunityId?: string,
  organizationId?: number,
  contactId?: number
) {
  const supabase = await getSupabaseClient()
  let query = supabase.from('notes').select('*').order('created_at', { ascending: false })
  if (opportunityId) query = query.eq('opportunity_id', opportunityId)
  if (organizationId) query = query.eq('organization_id', organizationId)
  if (contactId) query = query.eq('contact_id', contactId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function createNote(
  content: string,
  opportunityId?: string,
  organizationId?: number,
  contactId?: number,
  createdBy: string = 'System User'
) {
  const supabase = await getSupabaseClient()
  const record: any = { content, created_by: createdBy }
  if (opportunityId) record.opportunity_id = opportunityId
  if (organizationId) record.organization_id = organizationId
  if (contactId) record.contact_id = contactId

  const { data, error } = await supabase
    .from('notes')
    .insert([record])
    .select()

  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Note Added',
      `Added note to opportunity/client`,
      'note_added',
      opportunityId,
      organizationId,
      contactId
    )
  }

  return data ? data[0] : null
}

export async function getOpportunityDetail(id: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, organizations(name, industry, website_url)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteNote(id: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// AUTHENTICATION ACTIONS (PROPER SUPABASE AUTH)
// ==========================================
export async function sendOtpAction(email: string) {
  const cleanEmail = email ? email.toLowerCase().trim() : ''
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('humppl')) {
    return { error: "Access denied. Only @humppl.com or humppl-authorized emails can login." }
  }

  const supabase = await getSupabaseClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: true,
    }
  })

  if (error) {
    console.error("Auth OTP send failed:", error.message)
    return { error: error.message }
  }

  return { success: true }
}

export async function verifyOtpAction(email: string, enteredOtp: string) {
  const cleanEmail = email ? email.toLowerCase().trim() : ''
  const cleanOtp = enteredOtp ? enteredOtp.trim() : ''

  // Support demo mode bypass with admin credentials
  if (cleanEmail === 'humppllab@humppl.com' && cleanOtp === '123456') {
    return await demoLoginAction()
  }

  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanOtp,
    type: 'email'
  })

  if (error) {
    console.error("Auth verification failed:", error.message)
    return { error: error.message }
  }

  if (data && data.session) {
    const cookieStore = await cookies()
    cookieStore.set('humppl_session', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    cookieStore.set('sb-access-token', data.session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return { success: true }
  }

  return { error: "Verification failed. Invalid OTP or session." }
}

export async function demoLoginAction() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'humppllab@humppl.com',
    password: 'Password123!'
  })

  if (error) {
    console.error("Demo login bypass failed:", error.message)
    return { error: "Demo user has not been seeded yet. Please link database and run seed migrations." }
  }

  if (data && data.session) {
    const cookieStore = await cookies()
    cookieStore.set('humppl_session', 'authenticated', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    cookieStore.set('sb-access-token', data.session.access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    return { success: true }
  }

  return { error: "Demo session bypass failed." }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('humppl_session')
  cookieStore.delete('sb-access-token')

  const supabase = await getSupabaseClient()
  await supabase.auth.signOut()

  return { success: true }
}

// ==========================================
// CAMPAIGNS ACTIONS
// ==========================================
export async function getCampaigns() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createCampaign(title: string, objective: string, status: string = 'Planned') {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('campaigns')
    .insert([{ title, objective, status }])
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

export async function getCampaignMembers(campaignId: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('campaign_members')
    .select('*, contacts(*), leads(*)')
    .eq('campaign_id', campaignId)
  if (error) throw new Error(error.message)
  return data || []
}

export async function addCampaignMember(campaignId: string, contactId?: number, leadId?: number) {
  const supabase = await getSupabaseClient()
  const record: any = { campaign_id: campaignId }
  if (contactId) record.contact_id = contactId
  if (leadId) record.lead_id = leadId

  const { data, error } = await supabase
    .from('campaign_members')
    .insert([record])
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

export async function logEmailCampaignActivity(
  campaignId: string,
  contactId: number,
  subject: string,
  body: string
) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('email_logs')
    .insert([{ campaign_id: campaignId, contact_id: contactId, subject, body, send_status: 'Sent' }])
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// SUPPORT TICKETS ACTIONS
// ==========================================
export async function getTickets() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('tickets')
    .select('*, organizations(name)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createTicket(
  title: string,
  organizationId: number,
  category: string,
  priority: string,
  description: string
) {
  const supabase = await getSupabaseClient()
  const slaTarget = new Date()
  if (priority === 'High') slaTarget.setHours(slaTarget.getHours() + 24)
  else if (priority === 'Medium') slaTarget.setHours(slaTarget.getHours() + 48)
  else slaTarget.setHours(slaTarget.getHours() + 72)

  const { data, error } = await supabase
    .from('tickets')
    .insert([{ title, organization_id: organizationId, category, priority, description, status: 'Open', sla_target: slaTarget.toISOString() }])
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

export async function updateTicketStatus(ticketId: string, status: string, resolutionNotes?: string) {
  const supabase = await getSupabaseClient()
  const record: any = { status }
  if (resolutionNotes) record.resolution_notes = resolutionNotes

  const { data, error } = await supabase
    .from('tickets')
    .update(record)
    .eq('id', ticketId)
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

export async function getTicketComments(ticketId: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('ticket_comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function addTicketComment(ticketId: string, content: string, createdBy: string) {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('ticket_comments')
    .insert([{ ticket_id: ticketId, content, created_by: createdBy }])
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// UNIFIED FLOW & RESCHEDULE ACTIONS
// ==========================================
export async function createContactWithOrgAndOpp(
  firstName: string,
  lastName: string,
  email: string,
  jobTitle: string,
  phone: string,
  mobile: string,
  orgName: string,
  orgIndustry: string,
  orgWebsite: string,
  oppName: string,
  oppType: string,
  oppStage: string,
  oppValue: number,
  oppOwner: string
) {
  const supabase = await getSupabaseClient()
  let orgId: number
  const { data: existingOrgs, error: findError } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', orgName)
    .limit(1)

  if (findError) throw new Error(findError.message)

  if (existingOrgs && existingOrgs.length > 0) {
    orgId = existingOrgs[0].id
  } else {
    const { data: newOrg, error: orgError } = await supabase
      .from('organizations')
      .insert([{ name: orgName, industry: orgIndustry, website_url: orgWebsite }])
      .select()
    if (orgError) throw new Error(orgError.message)
    orgId = newOrg[0].id
  }

  const formattedJobTitle = `${jobTitle || 'N/A'} | Ph: ${phone || 'N/A'} | Mob: ${mobile || 'N/A'}`

  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert([{ 
      first_name: firstName, 
      last_name: lastName, 
      email, 
      job_title: formattedJobTitle, 
      organization_id: orgId 
    }])
    .select()

  if (contactError) throw new Error(contactError.message)
  const contact = newContact[0]

  const { data: newOpp, error: oppError } = await supabase
    .from('opportunities')
    .insert([{ 
      name: oppName, 
      type: oppType, 
      stage: oppStage, 
      value: oppValue, 
      owner: oppOwner, 
      organization_id: orgId 
    }])
    .select()

  if (oppError) throw new Error(oppError.message)
  const opp = newOpp[0]

  await createNote(
    `Contact created via Unified Flow.\nPhone: ${phone || 'N/A'}\nMobile: ${mobile || 'N/A'}\nLinked Organization: ${orgName}\nLinked Opportunity: ${oppName} (${formatRupees(oppValue)})`,
    opp.id,
    orgId,
    contact.id,
    oppOwner
  )

  await logActivity(
    'Unified Contact Created',
    `Created contact ${firstName} ${lastName}, organization ${orgName}, and opportunity ${oppName}`,
    'contact_created',
    opp.id,
    orgId,
    contact.id
  )

  return { contact, orgId, opp }
}

// ==========================================
// CSV EXPORT DATA HELPERS
// ==========================================
export async function getOrganizationsCsvData() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('name, industry, website_url, segment, priority, owner, status')
    .eq('archived', false)
    .order('name', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getContactsCsvData() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('first_name, last_name, email, job_title, organizations(name), contact_type, relationship_strength')
    .eq('archived', false)
    .order('first_name', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getProposalsCsvData() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('proposals')
    .select('title, organizations(name), value, status, date_sent, validity_date, payment_terms')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getCampaignsCsvData() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('title, objective, audience_segment, status, owner')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getTicketsCsvData() {
  const supabase = await getSupabaseClient()
  const { data, error } = await supabase
    .from('tickets')
    .select('title, organizations(name), owner, priority, category, status, sla_target')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

