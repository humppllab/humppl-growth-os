'use client'

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Loader2 } from "lucide-react"

import UserProfile from "@/components/settings/UserProfile"
import OrganizationSettings from "@/components/settings/OrganizationSettings"
import TeamManagement from "@/components/settings/TeamManagement"
import RolesPermissions from "@/components/settings/RolesPermissions"
import PipelineConfig from "@/components/settings/PipelineConfig"
import NotificationSettings from "@/components/settings/NotificationSettings"
import Integrations from "@/components/settings/Integrations"
import ActivityLogs from "@/components/settings/ActivityLogs"
import DataManagement from "@/components/settings/DataManagement"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4">
      <h1 className="text-3xl font-bold">CRM Administration Panel</h1>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-8">
          <Card>
            <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
            <CardContent><UserProfile /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Organization Settings</CardTitle></CardHeader>
            <CardContent><OrganizationSettings /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Team Management</CardTitle></CardHeader>
            <CardContent><TeamManagement /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
            <CardContent><RolesPermissions /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Pipeline Configuration</CardTitle></CardHeader>
            <CardContent><PipelineConfig /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Notification Settings</CardTitle></CardHeader>
            <CardContent><NotificationSettings /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Integrations</CardTitle></CardHeader>
            <CardContent><Integrations /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Activity Logs</CardTitle></CardHeader>
            <CardContent><ActivityLogs /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Data Management</CardTitle></CardHeader>
            <CardContent><DataManagement /></CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
