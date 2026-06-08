'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { ArrowLeft, AlertTriangle, Search, Loader2, Trash2, Plus, X } from "lucide-react"
import Link from "next/link"
import { getOpportunities } from "@/actions"

interface Opportunity {
  id: string
  name: string
  stage: string
  value: number
  owner: string
  organizations?: { name: string } | null
}

const FIELDS = [
  { label: "Opportunity Name", value: "name" },
  { label: "Stage", value: "stage" },
  { label: "Owner", value: "owner" },
  { label: "Organization", value: "organizations.name" },
]

const OPERATORS = [
  { label: "Contains", value: "contains" },
  { label: "Equals", value: "equals" },
  { label: "Starts with", value: "starts_with" },
  { label: "Ends with", value: "ends_with" },
]

interface Criterion {
  id: string
  field: string
  operator: string
  value: string
}

export default function OpportunitiesMassDeletePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: "1", field: "name", operator: "contains", value: "" }
  ])
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showConfirm, setShowConfirm] = useState(false)

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

  const handleSearch = () => {
    setSearching(true)
    setError("")
    
    try {
      const results = opportunities.filter(opp =>
        criteria.every(c => matchesCriterion(opp, c))
      )
      setFilteredOpportunities(results)
      setSelectedIds([])
    } catch (err: any) {
      setError("Error searching: " + err.message)
    } finally {
      setSearching(false)
    }
  }

  const matchesCriterion = (opportunity: Opportunity, criterion: Criterion): boolean => {
    let value = ""
    
    if (criterion.field === "name") value = opportunity.name || ""
    else if (criterion.field === "stage") value = opportunity.stage || ""
    else if (criterion.field === "owner") value = opportunity.owner || ""
    else if (criterion.field === "organizations.name") value = opportunity.organizations?.name || ""

    value = value.toLowerCase()
    const search = criterion.value.toLowerCase()

    switch (criterion.operator) {
      case "contains":
        return value.includes(search)
      case "equals":
        return value === search
      case "starts_with":
        return value.startsWith(search)
      case "ends_with":
        return value.endsWith(search)
      default:
        return true
    }
  }

  const addCriterion = () => {
    setCriteria([...criteria, { id: Date.now().toString(), field: "name", operator: "contains", value: "" }])
  }

  const updateCriterion = (id: string, key: keyof Criterion, val: string) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [key]: val } : c))
  }

  const removeCriterion = (id: string) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter(c => c.id !== id))
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOpportunities.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredOpportunities.map(o => o.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/opportunities">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mass Delete Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Define criteria to find and delete multiple opportunities.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-sm text-red-600 flex gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-sm text-green-600">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Criteria Builder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Criteria Builder</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {criteria.map((c, idx) => (
                <div key={c.id} className="space-y-2 pb-4 border-b last:border-0">
                  {idx > 0 && <div className="text-xs font-semibold text-gray-500 uppercase">AND</div>}
                  <select
                    value={c.field}
                    onChange={(e) => updateCriterion(c.id, "field", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    {FIELDS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={c.operator}
                    onChange={(e) => updateCriterion(c.id, "operator", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    {OPERATORS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={c.value}
                    onChange={(e) => updateCriterion(c.id, "value", e.target.value)}
                    placeholder="Enter value..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  {criteria.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCriterion(c.id)}
                      className="w-full text-red-600 border-red-200"
                    >
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addCriterion}
                className="w-full border-blue-200 text-blue-600"
              >
                <Plus className="h-3 w-3 mr-1" /> Add Criteria
              </Button>
              <Button onClick={handleSearch} disabled={searching} className="w-full">
                {searching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {searching ? "Searching..." : "Search"}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b flex justify-between">
                <CardTitle className="text-base">Results ({filteredOpportunities.length})</CardTitle>
                {selectedIds.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowConfirm(true)}
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete {selectedIds.length}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {filteredOpportunities.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No opportunities found</div>
                ) : (
                  <div className="divide-y">
                    {filteredOpportunities.map(opp => (
                      <div key={opp.id} className="p-4 hover:bg-gray-50 flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(opp.id)}
                          onChange={() => toggleSelect(opp.id)}
                          className="w-4 h-4 rounded border-gray-300 text-red-600"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{opp.name}</p>
                          <p className="text-xs text-gray-600">{opp.stage} • {opp.owner}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Confirm Delete
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-gray-700">
                Delete <strong>{selectedIds.length}</strong> opportunity(ies)? This cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="destructive" className="flex-1">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
