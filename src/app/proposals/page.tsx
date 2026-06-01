import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, FileText } from "lucide-react";

export default function ProposalsPage() {
  const proposals = [
    { id: 1, title: "HR Transformation Blueprint", client: "TechCorp Industries", value: "$120,000", date: "Oct 12, 2024", status: "Sent" },
    { id: 2, title: "Leadership Training Q3", client: "Innovate LLC", value: "$30,000", date: "Oct 10, 2024", status: "Under Discussion" },
    { id: 3, title: "Campus Readiness Mirror", client: "Stark Enterprises", value: "$80,000", date: "Oct 15, 2024", status: "Draft" },
    { id: 4, title: "Fractional CHRO Agreement", client: "Wayne Corp", value: "$60,000", date: "Oct 08, 2024", status: "Accepted" },
    { id: 5, title: "Executive Search Contract", client: "Global Finance Group", value: "$45,000", date: "Oct 05, 2024", status: "Approval Pending" },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'Accepted': return 'success';
      case 'Draft': return 'secondary';
      case 'Sent': return 'default';
      case 'Under Discussion': return 'warning';
      case 'Approval Pending': return 'warning';
      case 'Rejected': return 'destructive';
      case 'Expired': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
          <p className="text-sm text-gray-500 mt-1">Track proposal statuses and document lifecycles.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Proposal
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Proposal Title</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Date Sent / Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell className="font-medium text-blue-600 flex items-center">
                <FileText className="mr-2 h-4 w-4 text-gray-400" />
                {proposal.title}
              </TableCell>
              <TableCell>{proposal.client}</TableCell>
              <TableCell>{proposal.value}</TableCell>
              <TableCell>{proposal.date}</TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(proposal.status)}>
                  {proposal.status}
                </Badge>
              </TableCell>
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
