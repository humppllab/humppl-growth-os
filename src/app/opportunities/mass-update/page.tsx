'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ArrowLeft, AlertTriangle, Search, Loader2, Edit2 } from "lucide-react"
import Link from "next/link"
import { getOpportunities } from "@/actions"

interface Opportunity {
  id: string
  name: string
  stage: string
  value: number
  owner: string
}

export default function OpportunitiesMassUpdatePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getOpportunities()
        setOpportunities(data)
      } catch (err: any) {
        setError("Failed to load opportunities")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/opportunities">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mass Update Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Update fields for multiple opportunities.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-600 flex gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Mass Update - Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <p className="text-gray-600 mb-4">This feature will allow you to update fields for multiple opportunities at once.</p>
            <Link href="/opportunities">
              <Button variant="outline">Back to Opportunities</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
