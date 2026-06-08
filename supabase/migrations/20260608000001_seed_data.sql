-- Enable extensions needed for password crypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Seed Demo User in auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '00000000-0000-0000-0000-000000000000',
  'humppllab@humppl.com',
  crypt('Password123!', gen_salt('bf', 10)),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"first_name": "Humppllab", "last_name": "Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Map Profile for Demo User
INSERT INTO public.profiles (id, email, first_name, last_name, role, active)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'humppllab@humppl.com',
  'Humppllab',
  'Admin',
  'Admin',
  true
) ON CONFLICT (id) DO NOTHING;

-- Seed Pipeline Stages
INSERT INTO public.pipeline_stages (name, probability, sort_order) VALUES
('Introductory Email', 10, 1),
('1st Meeting', 20, 2),
('2nd Meeting', 30, 3),
('Technical Proposal', 40, 4),
('3rd Meeting', 50, 5),
('Commercial Proposal', 60, 6),
('4th Meeting', 70, 7),
('Negotiations', 80, 8),
('SLA Sent', 90, 9),
('5th Meeting', 95, 10),
('SLA Signed', 100, 11),
('6th Meeting', 100, 12),
('Client Onboarding', 100, 13),
('Internal Handover to Delivery', 100, 14)
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Organizations
INSERT INTO public.organizations (name, industry, website_url, segment, priority, owner, status) VALUES
('Edutech Global', 'Education', 'www.edutechglobal.com', 'campus', 'High', 'Sumit', 'prospect'),
('InnoCorp Labs', 'Technology', 'www.innocorp.com', 'business', 'Medium', 'Harsh', 'active client'),
('Zenith Recruitment', 'Consulting', 'www.zenithrec.com', 'partner', 'Low', 'Aditi', 'partner')
ON CONFLICT (name) DO NOTHING;

-- Seed Sample Contacts
INSERT INTO public.contacts (first_name, last_name, email, job_title, organization_id, contact_type, relationship_strength, preferred_channel) VALUES
('Jane', 'Smith', 'jane.smith@edutech.com', 'Placement Head', 1, 'placement head', 'Good', 'Email'),
('Robert', 'Downey', 'robert.d@innocorp.com', 'CHRO', 2, 'CHRO', 'Strong', 'Phone'),
('Alice', 'Wonder', 'alice.w@zenith.com', 'Founder', 3, 'founder', 'Weak', 'WhatsApp')
ON CONFLICT DO NOTHING;

-- Seed Sample Email Templates
INSERT INTO public.email_templates (title, subject, body, category, owner, review_status) VALUES
('Outreach Template', 'Partnership Opportunities with Humppl', 'Hi {ClientName},\n\nI hope this email finds you well.\n\nWe would love to connect for a partnership.', 'Outbound', 'Sumit', 'Approved')
ON CONFLICT DO NOTHING;
