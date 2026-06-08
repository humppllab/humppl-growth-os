import React from "react"

const roles = [
  { name: "Admin", description: "Full access to all CRM administration settings." },
  { name: "Manager", description: "Can manage teams, pipelines, and assignments." },
  { name: "Executive", description: "View dashboards and activity without admin controls." },
  { name: "Viewer", description: "Read-only access to records and reports." },
]

export default function RolesPermissions() {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <p className="text-gray-600">Set role-based permissions and control access for your CRM users.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <div key={role.name} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="font-semibold text-gray-900">{role.name}</p>
            <p className="mt-1 text-sm text-gray-500">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
