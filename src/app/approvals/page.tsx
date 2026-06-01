import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Check, X } from "lucide-react";

export default function ApprovalsPage() {
  const approvals = [
    { id: 1, request: "Discount 15% - Innovate LLC", requestedBy: "Alex D.", type: "Commercial", date: "Today", status: "Pending" },
    { id: 2, request: "Proposal Release - TechCorp", requestedBy: "Sarah M.", type: "Document", date: "Today", status: "Pending" },
    { id: 3, request: "Custom Payment Terms - Wayne Corp", requestedBy: "John K.", type: "Commercial", date: "Yesterday", status: "Pending" },
    { id: 4, request: "Travel Expense - NY Trip", requestedBy: "Alex D.", type: "Expense", date: "Oct 10, 2024", status: "Approved" },
    { id: 5, request: "Non-Standard NDA - Stark Ent.", requestedBy: "Sarah M.", type: "Legal", date: "Oct 08, 2024", status: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and manage pending approval requests.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[150px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell className="font-medium text-gray-900">{approval.request}</TableCell>
              <TableCell>{approval.type}</TableCell>
              <TableCell>{approval.requestedBy}</TableCell>
              <TableCell>{approval.date}</TableCell>
              <TableCell>
                <Badge variant={approval.status === 'Approved' ? 'success' : approval.status === 'Rejected' ? 'destructive' : 'warning'}>
                  {approval.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right space-x-2">
                {approval.status === 'Pending' && (
                  <>
                    <Button variant="outline" size="sm" className="h-8 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                      <Check className="mr-1 h-3 w-3" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                      <X className="mr-1 h-3 w-3" /> Reject
                    </Button>
                  </>
                )}
                {approval.status !== 'Pending' && (
                  <span className="text-sm text-gray-400 italic">No action needed</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
