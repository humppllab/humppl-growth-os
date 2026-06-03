export interface EmailTemplate {
  subject: string;
  body: string;
}

export const OPPORTUNITY_TYPES = [
  "Fractional CHRO",
  "HR Consulting & Transformation",
  "Recruitment Solutions",
  "Executive Search",
  "Leadership Training",
  "Coaching & Bootcamps",
  "Campus To Corporate Transformation",
  "Soft Skills Journey",
  "Faculty Catalyst Program",
  "C.O.R.E"
];

export const PIPELINE_STAGES = [
  "Introductory Email",
  "1st Meeting",
  "2nd Meeting",
  "Technical Proposal",
  "3rd Meeting",
  "Commercial Proposal",
  "4th Meeting",
  "Negotiations",
  "SLA Sent",
  "5th Meeting",
  "SLA Signed",
  "6th Meeting",
  "Client Onboarding",
  "Internal Handover to Delivery"
];

export function getEmailTemplate(
  stage: string,
  clientName: string = "Client",
  companyName: string = "your organization",
  oppType: string = "our solutions"
): EmailTemplate {
  const formattedClientName = clientName || "Client";
  const formattedCompanyName = companyName || "your organization";

  switch (stage) {
    case "Introductory Email":
      return {
        subject: `Partnership Opportunities with Humppl`,
        body: `Hi ${formattedClientName},

I hope this email finds you well.

I'm reaching out from Humppl. We partner with organizations and campuses to drive growth, capability building, and transformation. Here is an overview of our core focus areas:

For Businesses:
- Fractional CHRO
- HR Consulting & Transformation
- Recruitment Solutions & Executive Search
- Leadership Training & Coaching & Bootcamps

For Campuses:
- Campus To Corporate Transformation
- Soft Skills Journey
- Faculty Catalyst Program
- C.O.R.E

We would love to schedule a brief 1st Meeting to explore how we can support your goals. Please let us know your availability.

Best regards,
Humppl Growth Team`
      };

    case "1st Meeting":
    case "2nd Meeting":
    case "3rd Meeting":
    case "4th Meeting":
    case "5th Meeting":
    case "6th Meeting":
      return {
        subject: `Scheduling our ${stage} - Humppl`,
        body: `Hi ${formattedClientName},

Thank you for your time. Let's align on our next steps by scheduling our ${stage}.

Please let us know your availability this week for a brief call.

Best regards,
Humppl Growth Team`
      };

    case "Technical Proposal":
      return {
        subject: `Technical Proposal: Humppl Solutions for ${formattedCompanyName}`,
        body: `Hi ${formattedClientName},

We are pleased to share our Technical Proposal for your review. This details our proposed scope of work, methodology, and delivery timeline for the ${oppType} project.

We look forward to your feedback.

Best regards,
Humppl Growth Team`
      };

    case "Commercial Proposal":
      return {
        subject: `Commercial Proposal: Humppl Solutions for ${formattedCompanyName}`,
        body: `Hi ${formattedClientName},

Following our discussion, please find attached the Commercial Proposal detailing the investment structure, payment milestones, and terms for the ${oppType} project.

Let us know if you have any questions.

Best regards,
Humppl Growth Team`
      };

    case "Negotiations":
      return {
        subject: `Commercial Terms Alignment - Humppl`,
        body: `Hi ${formattedClientName},

Let's connect to finalize the terms and commercial structure for our partnership. We are committed to finding a mutually beneficial alignment to execute the ${oppType} project.

Best regards,
Humppl Growth Team`
      };

    case "SLA Sent":
      return {
        subject: `Draft Service Level Agreement (SLA) - Humppl & ${formattedCompanyName}`,
        body: `Hi ${formattedClientName},

Please find attached the draft Service Level Agreement (SLA) for your review and signatures. Let us know if any terms require adjustments.

Best regards,
Humppl Growth Team`
      };

    case "SLA Signed":
      return {
        subject: `Fully Signed SLA: Humppl & ${formattedCompanyName}`,
        body: `Hi ${formattedClientName},

Thank you. We have received the signed copy of our SLA. We are excited to officially kick off our partnership!

Best regards,
Humppl Growth Team`
      };

    case "Client Onboarding":
      return {
        subject: `Welcome to Humppl: Onboarding & Kickoff`,
        body: `Hi ${formattedClientName},

Welcome to Humppl! We are preparing your client onboarding checklist. Our team will schedule the kickoff meeting shortly to lock scope and delivery timelines.

Best regards,
Humppl Growth Team`
      };

    case "Internal Handover to Delivery":
      return {
        subject: `Internal Handover: Project Delivery Kickoff - Humppl & ${formattedCompanyName}`,
        body: `Hi Team,

I am pleased to confirm the internal handover of ${formattedCompanyName} for the ${oppType} project. 

All commercial agreements, scopes, and SLAs are finalized. Let's initiate the project execution and scheduling of the kickoff meeting.

Best regards,
Founder, Humppl`
      };

    default:
      return {
        subject: `Humppl CRM Update - ${formattedCompanyName}`,
        body: `Hi ${formattedClientName},

I hope this email finds you well. I wanted to share an update regarding our ongoing discussions.

Please let me know if you have any questions.

Best regards,
Humppl Growth Team`
      };
  }
}

export function openGmailCompose(template: EmailTemplate, recipientEmail: string = "") {
  const to = encodeURIComponent(recipientEmail);
  const subject = encodeURIComponent(template.subject);
  const body = encodeURIComponent(template.body);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;
  window.open(gmailUrl, "_blank");
}
