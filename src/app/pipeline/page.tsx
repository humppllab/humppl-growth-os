import { Card, CardContent } from "@/components/ui/Card";

export default function PipelinePage() {
  const columns = [
    { name: "New Lead", deals: [{ title: "Campus Hiring Drive", value: "$80,000", org: "Stark Enterprises" }] },
    { name: "Qualified", deals: [] },
    { name: "Meeting Booked", deals: [{ title: "Fractional CHRO Service", value: "$60,000", org: "Wayne Corp" }] },
    { name: "Discovery Done", deals: [{ title: "Executive Search - VP Sales", value: "$45,000", org: "Global Finance" }] },
    { name: "Solution Mapped", deals: [] },
    { name: "Proposal Draft", deals: [] },
    { name: "Proposal Sent", deals: [{ title: "HR Transformation 2024", value: "$120,000", org: "TechCorp" }] },
    { name: "Follow-Up Active", deals: [] },
    { name: "Negotiation", deals: [{ title: "Leadership Coaching Q3", value: "$30,000", org: "Innovate LLC" }] },
    { name: "Approval Pending", deals: [] },
    { name: "Won", deals: [] },
    { name: "Lost", deals: [] },
    { name: "Nurture", deals: [] },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">Drag and drop opportunities across stages.</p>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-[calc(100vh-200px)] min-w-max">
          {columns.map((column) => (
            <div key={column.name} className="w-80 flex flex-col bg-gray-50/80 rounded-xl border border-gray-200 shadow-sm">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-xl shrink-0">
                <h3 className="font-semibold text-gray-700 text-sm">{column.name}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full font-medium">
                  {column.deals.length}
                </span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {column.deals.map((deal, i) => (
                  <Card key={i} className="cursor-grab hover:border-blue-300 transition-colors shadow-sm">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 text-sm">{deal.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{deal.org}</p>
                      <div className="mt-3 text-sm font-semibold text-blue-600">{deal.value}</div>
                    </CardContent>
                  </Card>
                ))}
                {column.deals.length === 0 && (
                  <div className="h-20 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-sm text-gray-400">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
