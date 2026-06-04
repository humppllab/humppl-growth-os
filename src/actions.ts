'use server'
 
import { supabase } from './lib/supabase'
import { formatRupees } from './lib/utils'
import { cookies } from 'next/headers'

// ==========================================
// ACTIVITY TIMELINE ACTIONS
// ==========================================
export async function logActivity(
  title: string,
  description: string = '',
  type: string,
  opportunityId?: string,
  organizationId?: number,
  contactId?: number
) {
  const record: any = { title, description, type }
  if (opportunityId) record.opportunity_id = opportunityId
  if (organizationId) record.organization_id = organizationId
  if (contactId) record.contact_id = contactId

  const { data, error } = await supabase
    .from('activity_timeline')
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
  let query = supabase.from('activity_timeline').select('*').order('created_at', { ascending: false })
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
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createOrganization(name: string, industry: string, websiteUrl: string) {
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
  const { data, error } = await supabase
    .from('contacts')
    .select('*, organizations(name)')
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

// ==========================================
// OPPORTUNITIES ACTIONS
// ==========================================
export async function getOpportunities() {
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, organizations(name, contacts(*))')
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
  }
  return data ? data[0] : null
}

// ==========================================
// MEETINGS ACTIONS
// ==========================================
export async function getMeetings() {
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

// ==========================================
// FOLLOW-UPS ACTIONS
// ==========================================
export async function getFollowUps() {
  const { data, error } = await supabase
    .from('follow_ups')
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
  const { data, error } = await supabase
    .from('follow_ups')
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
  const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed'
  const { data, error } = await supabase
    .from('follow_ups')
    .update({ status: nextStatus })
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// PROPOSALS ACTIONS
// ==========================================
export async function getProposals() {
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
  dateSentStr?: string
) {
  const record: any = { title, organization_id: organizationId, value, status }
  if (dateSentStr) record.date_sent = dateSentStr

  const { data, error } = await supabase
    .from('proposals')
    .insert([record])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Proposal Created',
      `Proposal "${title}" created (Value: ${formatRupees(value)})`,
      'proposal_created',
      undefined,
      organizationId
    )
  }
  return data ? data[0] : null
}

// ==========================================
// APPROVALS ACTIONS
// ==========================================
export async function getApprovals() {
  const { data: approvals, error } = await supabase
    .from('approvals')
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
  status: string = 'Pending'
) {
  const { data, error } = await supabase
    .from('approvals')
    .insert([{ title, organization_id: organizationId, value, status }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Approval Requested',
      `Requested approval for "${title}" (Value: ${formatRupees(value)})`,
      'approval_requested',
      undefined,
      organizationId
    )
  }
  return data ? data[0] : null
}

export async function updateApprovalStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('approvals')
    .update({ status })
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
    undefined,
    result.organization_id
  )

  return result
}

// ==========================================
// DOCUMENTS ACTIONS
// ==========================================
export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
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
  size: string = '--'
) {
  const { data, error } = await supabase
    .from('documents')
    .insert([{ name, type, organization_id: organizationId, file_url: fileUrl, size }])
    .select()
  if (error) throw new Error(error.message)

  if (data && data[0]) {
    await logActivity(
      'Document Uploaded',
      `Uploaded document "${name}" (${type})`,
      'document_uploaded',
      undefined,
      organizationId
    )
  }
  return data ? data[0] : null
}

// ==========================================
// ONBOARDING ACTIONS
// ==========================================
export async function getOnboardingList() {
  const { data, error } = await supabase
    .from('onboarding')
    .select('*, organizations(name), onboarding_tasks(*)')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data || []
}

export async function createOnboarding(
  organizationId: number,
  project: string,
  tasks: string[] = []
) {
  // Insert onboarding record
  const { data: obData, error: obError } = await supabase
    .from('onboarding')
    .insert([{ organization_id: organizationId, project, progress: 0 }])
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
      undefined,
      organizationId
    )
  }

  return ob
}

export async function toggleOnboardingTask(taskId: string, currentStatus: boolean) {
  const nextStatus = !currentStatus
  const { data: taskData, error: taskError } = await supabase
    .from('onboarding_tasks')
    .update({ status: nextStatus })
    .eq('id', taskId)
    .select('*, onboarding(id, progress, organization_id, project)')
    .single()

  if (taskError) throw new Error(taskError.message)

  // Recalculate progress for the parent onboarding record
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
    .from('onboarding')
    .update({ progress })
    .eq('id', onboardingId)

  return { task: taskData, progress }
}

// ==========================================
// PROFILE ACTIONS
// ==========================================
export async function getProfile() {
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
  // Fetch counts from individual tables
  const [
    { count: orgsCount },
    { count: contactsCount },
    { data: opportunities },
    { data: meetings },
    { data: approvals },
    { data: recentActivities }
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('contacts').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('stage, value'),
    supabase.from('meetings').select('id, date_time'),
    supabase.from('approvals').select('id, status'),
    supabase.from('activity_timeline').select('*').order('created_at', { ascending: false }).limit(6)
  ])

  // Count active opportunities (any stage that is not Won, Lost, or Nurture)
  const activeOpps = (opportunities || []).filter(opp => 
    !['Won', 'Lost', 'Nurture'].includes(opp.stage)
  ).length

  // Count meetings today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date()
  endOfDay.setHours(23, 59, 59, 999)
  const meetingsToday = (meetings || []).filter(meet => {
    const d = new Date(meet.date_time)
    return d >= startOfDay && d <= endOfDay
  }).length

  // Count pending approvals
  const pendingApprovals = (approvals || []).filter(app => app.status === 'Pending').length

  // Count won deals
  const wonDeals = (opportunities || []).filter(opp => opp.stage === 'Won').length

  // Aggregate pipeline summary by stage
  // Stages: Discovery Done, Proposal Sent, Negotiation, Approval Pending
  const stagesOfInterest = ['Discovery Done', 'Proposal Sent', 'Negotiation', 'Approval Pending']
  const pipelineSummary = stagesOfInterest.map((stage, idx) => {
    const oppsInStage = (opportunities || []).filter(opp => opp.stage === stage)
    const count = oppsInStage.length
    const totalVal = oppsInStage.reduce((sum, opp) => sum + (Number(opp.value) || 0), 0)
    
    // Choose colors to match Aditi's theme
    const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-amber-500', 'bg-rose-500']
    
    return {
      stage,
      count,
      value: formatRupees(totalVal),
      color: colors[idx % colors.length]
    }
  })

  // Format activity timeline
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
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, organizations(name, industry, website_url)')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteNote(id: string) {
  const { data, error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id)
    .select()
  if (error) throw new Error(error.message)
  return data ? data[0] : null
}

// ==========================================
// AUTHENTICATION ACTIONS
// ==========================================
export async function sendOtpAction(email: string) {
  const cleanEmail = email ? email.toLowerCase().trim() : ''
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { error: "Please enter a valid email address." }
  }
  // Enforce domain restrictions
  if (!cleanEmail.includes('humppl')) {
    return { error: "Access denied. Only @humppl.com or humppl-authorized emails can login." }
  }
  // Generate random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  
  const cookieStore = await cookies()
  cookieStore.set('humppl_temp_otp', JSON.stringify({ email: cleanEmail, otp }), {
    path: '/',
    maxAge: 60 * 5, // 5 minutes validity
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
  
  console.log(`[OTP Sent] Email: ${cleanEmail} | OTP: ${otp}`)
  return { success: true, otp }
}

export async function verifyOtpAction(email: string, enteredOtp: string) {
  const cleanEmail = email ? email.toLowerCase().trim() : ''
  const cleanOtp = enteredOtp ? enteredOtp.trim() : ''
  
  const cookieStore = await cookies()
  const tempOtpCookie = cookieStore.get('humppl_temp_otp')
  
  if (!tempOtpCookie) {
    return { error: "OTP expired or not requested. Please request a new OTP." }
  }
  
  try {
    const { email: savedEmail, otp: savedOtp } = JSON.parse(tempOtpCookie.value)
    if (savedEmail === cleanEmail && savedOtp === cleanOtp) {
      cookieStore.delete('humppl_temp_otp')
      
      cookieStore.set('humppl_session', 'authenticated', {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      })
      return { success: true }
    }
  } catch (e) {
    // fallback
  }
  
  return { error: "Incorrect OTP. Please check the code and try again." }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('humppl_session')
  return { success: true }
}

// ==========================================
// UNIFIED CRM WORKFLOW ACTIONS
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
  // 1. Create or Find Organization
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

  // 2. Format jobTitle to store phone numbers
  const formattedJobTitle = `${jobTitle || 'N/A'} | Ph: ${phone || 'N/A'} | Mob: ${mobile || 'N/A'}`

  // 3. Create Contact linked to Org
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

  // 4. Create Opportunity linked to Org
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

  // 5. Automatically create a Note detailing the contact and phone numbers
  await createNote(
    `Contact created via Unified Flow.\nPhone: ${phone || 'N/A'}\nMobile: ${mobile || 'N/A'}\nLinked Organization: ${orgName}\nLinked Opportunity: ${oppName} (${formatRupees(oppValue)})`,
    opp.id,
    orgId,
    contact.id,
    oppOwner
  )

  // 6. Log activity timeline
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

export async function updateMeetingDateTime(id: string, dateTimeStr: string) {
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



