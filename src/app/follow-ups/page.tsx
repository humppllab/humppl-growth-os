import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal } from "lucide-react";

export default function FollowUpsPage() {
  const followUps = [
    { id: 1, client: "Innovate LLC", date: "Today", owner: "Alex D.", status: "Pending" },
    { id: 2, client: "Stark Enterprises", date: "Tomorrow", owner: "John K.", status: "Pending" },
    { id: 3, client: "TechCorp Industries", date: "Oct 18, 2024", owner: "Sarah M.", status: "Scheduled" },
    { id: 4, client: "Global Finance Group", date: "Yesterday", owner: "Sarah M.", status: "Completed" },
    { id: 5, client: "Wayne Corp", date: "Oct 12, 2024", owner: "Alex D.", status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-1">Track pending client communications and actions.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Follow-up
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Follow-Up Date</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.map((followUp) => (
            <TableRow key={followUp.id}>
              <TableCell className="font-medium text-gray-900">{followUp.client}</TableCell>
              <TableCell className={followUp.date === 'Today' || followUp.date === 'Yesterday' ? 'text-red-600 font-medium' : ''}>
                {followUp.date}
              </TableCell>
              <TableCell>{followUp.owner}</TableCell>
              <TableCell>
                <Badge variant={followUp.status === 'Completed' ? 'success' : followUp.status === 'Scheduled' ? 'secondary' : 'warning'}>
                  {followUp.status}
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
