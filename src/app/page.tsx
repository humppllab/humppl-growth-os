import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Building2, Users, Briefcase, Calendar, CheckSquare, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getDashboardMetrics } from "@/actions";
import ExportCsvButton from "@/components/ui/ExportCsvButton";

export default async function Dashboard() {
  let stats;
  try {
    stats = await getDashboardMetrics();
  } catch (e) {
    console.error("Dashboard fetch error:", e);
    stats = {
      totalOrganizations: 0,
      totalContacts: 0,
      activeOpportunities: 0,
      meetingsToday: 0,
      pendingApprovals: 0,
      wonDeals: 0,
      pipelineSummary: [
        { stage: "Discovery Done", count: 0, value: "₹0", color: "bg-blue-500" },
        { stage: "Proposal Sent", count: 0, value: "₹0", color: "bg-indigo-500" },
        { stage: "Negotiation", count: 0, value: "₹0", color: "bg-amber-500" },
        { stage: "Approval Pending", count: 0, value: "₹0", color: "bg-rose-500" },
      ],
      recentActivities: [
        { title: "Setup error: Please check Supabase connection.", time: "Just now", type: "system" }
      ]
    };
  }

  const metrics = [
    { title: "Total Organizations", value: stats.totalOrganizations.toString(), icon: Building2, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Contacts", value: stats.totalContacts.toString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Active Opportunities", value: stats.activeOpportunities.toString(), icon: Briefcase, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "Meetings Today", value: stats.meetingsToday.toString(), icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Pending Approvals", value: stats.pendingApprovals.toString(), icon: CheckSquare, color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Won Deals", value: stats.wonDeals.toString(), icon: Trophy, color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your clients today.</p>
        </div>
        <div className="shrink-0">
          <ExportCsvButton />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="p-6 flex items-center">
                <div className={`${metric.bg} ${metric.color} p-4 rounded-xl mr-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{metric.title}</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</h3>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activities</CardTitle>
            <Link href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {stats.recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500">No recent activity.</p>
              ) : (
                stats.recentActivities.map((activity: any, i: number) => (
                  <div key={i} className="flex">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      {i !== stats.recentActivities.length - 1 && <div className="w-px h-full bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Opportunity Pipeline Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pipeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pipelineSummary.map((stage: any, i: number) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-gray-900 font-semibold">{stage.value} <span className="text-gray-400 font-normal">({stage.count})</span></span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${stage.color} h-2 rounded-full`} style={{ width: `${Math.min(100, (stage.count / 30) * 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
