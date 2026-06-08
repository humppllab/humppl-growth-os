'use client'

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Download, Loader2 } from "lucide-react"
import { 
  getOpportunities,
  getOrganizationsCsvData,
  getContactsCsvData,
  getProposalsCsvData,
  getCampaignsCsvData,
  getTicketsCsvData,
  getLeadsCsvData
} from "@/actions"

interface ExportCsvButtonProps {
  module?: 'organizations' | 'contacts' | 'opportunities' | 'proposals' | 'campaigns' | 'tickets' | 'leads';
}

export default function ExportCsvButton({ module = 'opportunities' }: ExportCsvButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      let data: any[] = []
      let headers: string[] = []
      let filename = `Humppl_${module}_`

      // Format helper for CSV escaping
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return ""
        let str = String(val)
        str = str.replace(/"/g, '""')
        if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
          str = `"${str}"`
        }
        return str
      }

      let rows: any[][] = []

      if (module === 'opportunities') {
        const opps = await getOpportunities()
        headers = ["Opportunity Name", "Organization", "Deal Value (INR)", "Stage", "Type", "Owner", "Created At"]
        rows = opps.map(opp => [
          escapeCSV(opp.name),
          escapeCSV(
            Array.isArray(opp.organizations)
              ? opp.organizations[0]?.name
              : (opp.organizations ? (opp.organizations as any).name : "Independent")
          ),
          opp.value || 0,
          escapeCSV(opp.stage),
          escapeCSV(opp.type),
          escapeCSV(opp.owner || "humppllab@humppl.com"),
          new Date(opp.created_at).toLocaleDateString("en-IN")
        ])
      } else if (module === 'organizations') {
        const orgs = await getOrganizationsCsvData()
        headers = ["Organization Name", "Industry", "Website URL", "Segment", "Priority", "Owner", "Status"]
        rows = orgs.map(org => [
          escapeCSV(org.name),
          escapeCSV(org.industry || ""),
          escapeCSV(org.website_url || ""),
          escapeCSV(org.segment || ""),
          escapeCSV(org.priority || ""),
          escapeCSV(org.owner || "humppllab@humppl.com"),
          escapeCSV(org.status || "")
        ])
      } else if (module === 'contacts') {
        const contacts = await getContactsCsvData()
        headers = ["First Name", "Last Name", "Email Address", "Job Title", "Organization", "Contact Type", "Relationship Strength"]
        rows = contacts.map(c => [
          escapeCSV(c.first_name),
          escapeCSV(c.last_name),
          escapeCSV(c.email),
          escapeCSV(c.job_title || ""),
          escapeCSV(
            Array.isArray(c.organizations)
              ? c.organizations[0]?.name
              : (c.organizations ? (c.organizations as any).name : "")
          ),
          escapeCSV(c.contact_type || ""),
          escapeCSV(c.relationship_strength || "")
        ])
      } else if (module === 'proposals') {
        const proposals = await getProposalsCsvData()
        headers = ["Proposal Title", "Organization", "Value (INR)", "Status", "Date Sent", "Validity Date", "Payment Terms"]
        rows = proposals.map(p => [
          escapeCSV(p.title),
          escapeCSV(
            Array.isArray(p.organizations)
              ? p.organizations[0]?.name
              : (p.organizations ? (p.organizations as any).name : "")
          ),
          p.value || 0,
          escapeCSV(p.status),
          p.date_sent ? new Date(p.date_sent).toLocaleDateString("en-IN") : "",
          p.validity_date ? new Date(p.validity_date).toLocaleDateString("en-IN") : "",
          escapeCSV(p.payment_terms || "")
        ])
      } else if (module === 'campaigns') {
        const campaigns = await getCampaignsCsvData()
        headers = ["Campaign Title", "Objective", "Audience Segment", "Status", "Owner"]
        rows = campaigns.map(c => [
          escapeCSV(c.title),
          escapeCSV(c.objective || ""),
          escapeCSV(c.audience_segment || ""),
          escapeCSV(c.status),
          escapeCSV(c.owner || "humppllab@humppl.com")
        ])
      } else if (module === 'tickets') {
        const tickets = await getTicketsCsvData()
        headers = ["Ticket Title", "Organization", "Owner", "Priority", "Category", "Status", "SLA Target"]
        rows = tickets.map(t => [
          escapeCSV(t.title),
          escapeCSV(
            Array.isArray(t.organizations)
              ? t.organizations[0]?.name
              : (t.organizations ? (t.organizations as any).name : "")
          ),
          escapeCSV(t.owner || ""),
          escapeCSV(t.priority),
          escapeCSV(t.category),
          escapeCSV(t.status),
          t.sla_target ? new Date(t.sla_target).toLocaleString("en-IN") : ""
        ])
      } else if (module === 'leads') {
        const leads = await getLeadsCsvData()
        headers = ["First Name", "Last Name", "Email Address", "Phone", "Mobile", "Job Title", "Organization", "Source", "Lead Quality", "Priority Score", "Owner", "Status", "Converted"]
        rows = leads.map(l => [
          escapeCSV(l.first_name),
          escapeCSV(l.last_name),
          escapeCSV(l.email),
          escapeCSV(l.phone || ""),
          escapeCSV(l.mobile || ""),
          escapeCSV(l.job_title || ""),
          escapeCSV(l.organization_name),
          escapeCSV(l.source || ""),
          escapeCSV(l.lead_quality || ""),
          l.priority_score || 0,
          escapeCSV(l.owner || "humppllab@humppl.com"),
          escapeCSV(l.qualification_status || ""),
          l.converted ? "Yes" : "No"
        ])
      }

      if (rows.length === 0) {
        alert(`No ${module} data found to export.`)
        setExporting(false)
        return
      }

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n")

      // Create download blob
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const dateStr = new Date().toISOString().split("T")[0]
      
      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}${dateStr}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("CSV Export failed:", err)
      alert("Failed to export CSV. Please check console logs.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button 
      onClick={handleExport} 
      disabled={exporting}
      variant="outline"
      className="h-9 hover:bg-slate-50 border-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-all"
    >
      {exporting ? (
        <>
          <Loader2 className="animate-spin mr-2 h-4 w-4 text-gray-500" /> Exporting...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4 text-gray-500" /> Export {module.charAt(0).toUpperCase() + module.slice(1)}
        </>
      )}
    </Button>
  )
}
