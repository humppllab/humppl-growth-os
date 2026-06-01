import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal } from "lucide-react";

export default function OpportunitiesPage() {
  const opportunities = [
    { id: 1, name: "HR Transformation 2024", org: "TechCorp Industries", type: "HR Consulting", stage: "Proposal Sent", value: "$120,000", owner: "Alex D." },
    { id: 2, name: "Executive Search - VP Sales", org: "Global Finance Group", type: "Executive Search", stage: "Discovery Done", value: "$45,000", owner: "Sarah M." },
    { id: 3, name: "Leadership Coaching Q3", org: "Innovate LLC", type: "Leadership Training", stage: "Negotiation", value: "$30,000", owner: "Alex D." },
    { id: 4, name: "Campus Hiring Drive", org: "Stark Enterprises", type: "Campus Readiness Mirror", stage: "New Lead", value: "$80,000", owner: "John K." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Opportunities</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage your sales opportunities.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Opportunity
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Opportunity Name</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Deal Value</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map((opp) => (
            <TableRow key={opp.id}>
              <TableCell className="font-medium text-blue-600">{opp.name}</TableCell>
              <TableCell>{opp.org}</TableCell>
              <TableCell>{opp.type}</TableCell>
              <TableCell>
                <Badge variant="secondary">{opp.stage}</Badge>
              </TableCell>
              <TableCell className="font-medium text-gray-900">{opp.value}</TableCell>
              <TableCell>{opp.owner}</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
