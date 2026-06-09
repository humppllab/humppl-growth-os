-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  role text DEFAULT 'Viewer'::text CHECK (role IN ('Admin', 'Growth Lead', 'Delivery Lead', 'Analyst', 'Developer/Admin Support', 'Viewer')),
  active boolean DEFAULT true NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text UNIQUE NOT NULL,
  industry text,
  website_url text,
  segment text CHECK (segment IN ('business', 'campus', 'partner', 'vendor', 'client')),
  priority text CHECK (priority IN ('High', 'Medium', 'Low')),
  owner text,
  status text CHECK (status IN ('prospect', 'active client', 'partner', 'dormant', 'lost')),
  archived boolean DEFAULT false NOT NULL
);

-- Enable RLS on Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  job_title text,
  phone text,
  mobile text,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE SET NULL,
  contact_type text CHECK (contact_type IN ('decision maker', 'influencer', 'coordinator', 'HR', 'placement head', 'founder', 'CHRO', 'other')),
  relationship_strength text CHECK (relationship_strength IN ('Strong', 'Good', 'Weak')),
  preferred_channel text CHECK (preferred_channel IN ('Email', 'WhatsApp', 'Phone')),
  archived boolean DEFAULT false NOT NULL
);

-- Enable RLS on Contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- 4. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone text,
  mobile text,
  job_title text,
  organization_name text,
  source text,
  campaign_source text,
  referral_source text,
  lead_quality text CHECK (lead_quality IN ('High', 'Medium', 'Low')),
  priority_score integer DEFAULT 0,
  owner text,
  qualification_status text DEFAULT 'Raw'::text CHECK (qualification_status IN ('Raw', 'Contacted', 'Qualified', 'Nurture', 'Disqualified')),
  converted boolean DEFAULT false NOT NULL,
  archived boolean DEFAULT false NOT NULL
);

-- Enable RLS on Leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Opportunities Table
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text,
  stage text NOT NULL,
  value numeric(15,2) DEFAULT 0.00 NOT NULL,
  owner text,
  probability integer DEFAULT 0,
  expected_close_date date,
  primary_contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  loss_reason text,
  next_followup_date date,
  archived boolean DEFAULT false NOT NULL
);

-- Enable RLS on Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- 6. Meetings Table
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  date_time timestamp with time zone NOT NULL,
  status text DEFAULT 'Scheduled'::text CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'No Show')),
  notes text,
  outcome text,
  next_step text
);

-- Enable RLS on Meetings
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 7. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status text DEFAULT 'Pending'::text CHECK (status IN ('Pending', 'Completed', 'Cancelled', 'Overdue')),
  owner text,
  entity_type text,
  entity_id text
);

-- Enable RLS on Tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 8. Followups Table (Standardized Follow_ups replacement)
CREATE TABLE IF NOT EXISTS public.followups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  date date NOT NULL,
  owner text,
  status text DEFAULT 'Pending'::text CHECK (status IN ('Pending', 'Completed')),
  notes text
);

-- Enable RLS on Followups
ALTER TABLE public.followups ENABLE ROW LEVEL SECURITY;

-- 9. Proposals Table
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  value numeric(15,2) DEFAULT 0.00 NOT NULL,
  status text DEFAULT 'Draft'::text CHECK (status IN ('Draft', 'Internal Review', 'Approved', 'Sent', 'Under Discussion', 'Accepted', 'Rejected', 'Expired')),
  date_sent date,
  validity_date date,
  payment_terms text,
  scope text,
  decision_maker_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  pricing_model text
);

-- Enable RLS on Proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- 10. Pricing Items Table
CREATE TABLE IF NOT EXISTS public.pricing_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  quantity numeric(12,2) DEFAULT 1.00 NOT NULL,
  rate numeric(15,2) DEFAULT 0.00 NOT NULL,
  discount numeric(5,2) DEFAULT 0.00 NOT NULL,
  total numeric(15,2) DEFAULT 0.00 NOT NULL
);

-- Enable RLS on Pricing Items
ALTER TABLE public.pricing_items ENABLE ROW LEVEL SECURITY;

-- 11. Approval Requests Table (Standardized approvals replacement)
CREATE TABLE IF NOT EXISTS public.approval_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  reason text,
  requested_value numeric(15,2) DEFAULT 0.00 NOT NULL,
  current_quote numeric(15,2) DEFAULT 0.00 NOT NULL,
  approver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'Pending'::text CHECK (status IN ('Draft', 'Pending', 'Approved', 'Rejected', 'Changes Requested')),
  decision_notes text
);

-- Enable RLS on Approval Requests
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;

-- 12. Documents Shared Table (Standardized documents replacement)
CREATE TABLE IF NOT EXISTS public.documents_shared (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  name text NOT NULL,
  type text CHECK (type IN ('deck', 'case study', 'proposal', 'agreement', 'pricing sheet', 'onboarding doc')),
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  file_url text,
  size text DEFAULT '--'::text,
  version text DEFAULT '1.0'::text,
  shared_with text,
  shared_by text,
  shared_date date,
  followup_required boolean DEFAULT false NOT NULL,
  followup_due_date date
);

-- Enable RLS on Documents Shared
ALTER TABLE public.documents_shared ENABLE ROW LEVEL SECURITY;

-- 13. Onboarding Checklists Table (Standardized onboarding replacement)
CREATE TABLE IF NOT EXISTS public.onboarding_checklists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  project text NOT NULL,
  progress integer DEFAULT 0 NOT NULL,
  delivery_owner text,
  client_spoc text,
  agreement_status text CHECK (agreement_status IN ('Draft', 'Sent', 'Signed', 'Pending')),
  invoice_status text CHECK (invoice_status IN ('Unsent', 'Sent', 'Paid', 'Overdue')),
  kickoff_status text CHECK (kickoff_status IN ('Pending', 'Scheduled', 'Completed')),
  scope_lock_status text CHECK (scope_lock_status IN ('Draft', 'Under Review', 'Locked')),
  success_metrics text,
  delivery_timeline text
);

-- Enable RLS on Onboarding Checklists
ALTER TABLE public.onboarding_checklists ENABLE ROW LEVEL SECURITY;

-- 14. Onboarding Tasks Table
CREATE TABLE IF NOT EXISTS public.onboarding_tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  onboarding_id uuid REFERENCES public.onboarding_checklists(id) ON DELETE CASCADE,
  name text NOT NULL,
  status boolean DEFAULT false NOT NULL,
  owner text,
  due_date date
);

-- Enable RLS on Onboarding Tasks
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- 15. Tickets Table
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  description text,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  owner text,
  priority text DEFAULT 'Medium'::text CHECK (priority IN ('High', 'Medium', 'Low')),
  category text CHECK (category IN ('Request', 'Issue', 'Escalation', 'Risk')),
  status text DEFAULT 'Open'::text CHECK (status IN ('Open', 'In Progress', 'Pending', 'Resolved')),
  sla_target timestamp with time zone,
  resolution_notes text
);

-- Enable RLS on Tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- 16. Ticket Comments Table
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ticket_id uuid REFERENCES public.tickets(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by text NOT NULL
);

-- Enable RLS on Ticket Comments
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- 17. Activity Logs Table (Standardized activity_timeline replacement)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS on Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 18. Notes Table
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  content text NOT NULL,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_by text NOT NULL
);

-- Enable RLS on Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- 19. Data Quality Flags Table
CREATE TABLE IF NOT EXISTS public.data_quality_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  organization_id bigint REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
  flag_type text NOT NULL,
  description text
);

-- Enable RLS on Data Quality Flags
ALTER TABLE public.data_quality_flags ENABLE ROW LEVEL SECURITY;

-- 20. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  objective text,
  audience_segment text,
  status text DEFAULT 'Planned'::text CHECK (status IN ('Planned', 'Active', 'Completed', 'Cancelled')),
  owner text
);

-- Enable RLS on Campaigns
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 21. Campaign Members Table
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id bigint REFERENCES public.leads(id) ON DELETE SET NULL,
  status text DEFAULT 'Planned'::text CHECK (status IN ('Planned', 'Sent', 'Replied', 'Interested', 'Not Interested', 'Meeting Booked', 'Converted', 'Bounced', 'Unsubscribed'))
);

-- Enable RLS on Campaign Members
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;

-- 22. Email Templates Table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  title text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text,
  owner text,
  review_status text DEFAULT 'Draft'::text CHECK (review_status IN ('Draft', 'Approved'))
);

-- Enable RLS on Email Templates
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- 23. Email Logs Table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  contact_id bigint REFERENCES public.contacts(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  subject text,
  body text,
  send_status text DEFAULT 'Sent'::text,
  response_status text
);

-- Enable RLS on Email Logs
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 24. Pipeline Stages Master Table
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text UNIQUE NOT NULL,
  probability integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);

-- Enable RLS on Pipeline Stages
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- 25. Profile Settings Table
CREATE TABLE IF NOT EXISTS public.profile_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  first_name text,
  last_name text,
  email text UNIQUE NOT NULL,
  company_name text DEFAULT 'Humppl Private Limited'::text NOT NULL
);

-- Enable RLS on Profile Settings
ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;

