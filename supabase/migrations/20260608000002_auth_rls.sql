-- Trigger to automatically create a Profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, role, active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', ''),
    COALESCE(new.raw_user_meta_data->>'last_name', ''),
    'Viewer',
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper function to fetch current user's role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- --------------------------------------------------
-- RLS POLICIES FOR CRM TABLES
-- --------------------------------------------------

-- 1. Profiles Policies
CREATE POLICY "Select Profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'Admin');

-- 2. Organizations Policies
CREATE POLICY "Select Organizations" ON public.organizations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Organizations" ON public.organizations
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 3. Contacts Policies
CREATE POLICY "Select Contacts" ON public.contacts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Contacts" ON public.contacts
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 4. Leads Policies
CREATE POLICY "Select Leads" ON public.leads
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Leads" ON public.leads
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 5. Opportunities Policies
CREATE POLICY "Select Opportunities" ON public.opportunities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Opportunities" ON public.opportunities
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 6. Meetings Policies
CREATE POLICY "Select Meetings" ON public.meetings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Meetings" ON public.meetings
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 7. Tasks Policies
CREATE POLICY "Select Tasks" ON public.tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Tasks" ON public.tasks
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 8. Followups Policies
CREATE POLICY "Select Followups" ON public.followups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Followups" ON public.followups
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 9. Proposals Policies
CREATE POLICY "Select Proposals" ON public.proposals
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Proposals" ON public.proposals
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 10. Pricing Items Policies
CREATE POLICY "Select Pricing Items" ON public.pricing_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Pricing Items" ON public.pricing_items
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 11. Approval Requests Policies
CREATE POLICY "Select Approval Requests" ON public.approval_requests
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Approval Requests" ON public.approval_requests
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 12. Documents Shared Policies
CREATE POLICY "Select Documents Shared" ON public.documents_shared
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Documents Shared" ON public.documents_shared
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 13. Onboarding Checklists Policies
CREATE POLICY "Select Onboarding Checklists" ON public.onboarding_checklists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Onboarding Checklists" ON public.onboarding_checklists
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Delivery Lead'));

-- 14. Onboarding Tasks Policies
CREATE POLICY "Select Onboarding Tasks" ON public.onboarding_tasks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Onboarding Tasks" ON public.onboarding_tasks
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Delivery Lead'));

-- 15. Tickets Policies
CREATE POLICY "Select Tickets" ON public.tickets
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Tickets" ON public.tickets
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Delivery Lead', 'Growth Lead'));

-- 16. Ticket Comments Policies
CREATE POLICY "Select Ticket Comments" ON public.ticket_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Ticket Comments" ON public.ticket_comments
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Delivery Lead', 'Growth Lead'));

-- 17. Activity Logs Policies
CREATE POLICY "Select Activity Logs" ON public.activity_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Activity Logs" ON public.activity_logs
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 18. Notes Policies
CREATE POLICY "Select Notes" ON public.notes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Notes" ON public.notes
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead', 'Delivery Lead'));

-- 19. Data Quality Flags Policies
CREATE POLICY "Select Data Quality Flags" ON public.data_quality_flags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Data Quality Flags" ON public.data_quality_flags
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Analyst'));

-- 20. Campaigns Policies
CREATE POLICY "Select Campaigns" ON public.campaigns
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Campaigns" ON public.campaigns
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 21. Campaign Members Policies
CREATE POLICY "Select Campaign Members" ON public.campaign_members
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Campaign Members" ON public.campaign_members
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 22. Email Templates Policies
CREATE POLICY "Select Email Templates" ON public.email_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Email Templates" ON public.email_templates
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 23. Email Logs Policies
CREATE POLICY "Select Email Logs" ON public.email_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Email Logs" ON public.email_logs
  FOR ALL USING (public.get_user_role() IN ('Admin', 'Growth Lead'));

-- 24. Pipeline Stages Policies
CREATE POLICY "Select Pipeline Stages" ON public.pipeline_stages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Pipeline Stages" ON public.pipeline_stages
  FOR ALL USING (public.get_user_role() = 'Admin');

-- 25. Profile Settings Policies
CREATE POLICY "Select Profile Settings" ON public.profile_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Write Profile Settings" ON public.profile_settings
  FOR ALL USING (auth.role() = 'authenticated');

