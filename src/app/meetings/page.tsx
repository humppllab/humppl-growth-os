import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal, Calendar as CalendarIcon } from "lucide-react";

export default function MeetingsPage() {
  const meetings = [
    { id: 1, title: "Kickoff: HR Transformation", org: "TechCorp Industries", date: "Today, 2:00 PM", status: "Upcoming" },
    { id: 2, title: "Discovery Call - Sales Head", org: "Global Finance Group", date: "Tomorrow, 11:30 AM", status: "Upcoming" },
    { id: 3, title: "Proposal Review", org: "Innovate LLC", date: "Oct 15, 2024", status: "Scheduled" },
    { id: 4, title: "Initial Consultation", org: "Wayne Corp", date: "Oct 12, 2024", status: "Completed" },
    { id: 5, title: "Campus Strategy Session", org: "Stark Enterprises", date: "Oct 10, 2024", status: "Completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meetings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your calendar and client appointments.</p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" /> Schedule Meeting
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Meeting Title</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Date & Time</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetings.map((meeting) => (
            <TableRow key={meeting.id}>
              <TableCell className="font-medium text-gray-900">{meeting.title}</TableCell>
              <TableCell>{meeting.org}</TableCell>
              <TableCell>{meeting.date}</TableCell>
              <TableCell>
                <Badge variant={meeting.status === 'Completed' ? 'secondary' : 'default'}>
                  {meeting.status}
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
