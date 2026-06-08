'use client'

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Download, Loader2 } from "lucide-react"
import { getOpportunities } from "@/actions"

export default function ExportCsvButton() {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const opps = await getOpportunities()
      
      if (!opps || opps.length === 0) {
        console.warn("No opportunity data found to export.")
        setExporting(false)
        return
      }

      // CSV headers
      const headers = [
        "Opportunity Name",
        "Organization",
        "Deal Value (INR)",
        "Stage",
        "Type",
        "Owner",
        "Created At"
      ]

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

      // Convert data to CSV rows
      const rows = opps.map(opp => [
        escapeCSV(opp.name),
        escapeCSV(opp.organizations?.name || "Independent"),
        opp.value || 0,
        escapeCSV(opp.stage),
        escapeCSV(opp.type),
        escapeCSV(opp.owner || "Sumit"),
        new Date(opp.created_at).toLocaleDateString("en-IN")
      ])

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
      link.setAttribute("download", `Humppl_Opportunities_Pipeline_${dateStr}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("CSV Export failed:", err)
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
          <Download className="mr-2 h-4 w-4 text-gray-500" /> Export CSV
        </>
      )}
    </Button>
  )
}
