import React from "react"

const logs = [
  { time: "09:14 AM", user: "Samantha", action: "Updated contact record" },
  { time: "08:53 AM", user: "Marcus", action: "Added new opportunity" },
  { time: "Yesterday", user: "Priya", action: "Changed team permissions" },
]

export default function ActivityLogs() {
  return (
    <div className="overflow-x-auto text-sm text-gray-700">
      <p className="mb-3 text-gray-600">Recent system activity and audit log entries.</p>
      <table className="min-w-full divide-y divide-gray-200 border border-gray-200 bg-white">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-2">Time</th>
            <th className="px-4 py-2">User</th>
            <th className="px-4 py-2">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {logs.map((log) => (
            <tr key={`${log.time}-${log.user}`}>
              <td className="px-4 py-3">{log.time}</td>
              <td className="px-4 py-3">{log.user}</td>
              <td className="px-4 py-3">{log.action}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
