import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal } from "lucide-react";

export default function ContactsPage() {
  const contacts = [
    { id: 1, name: "Sarah Connor", designation: "CHRO", email: "sarah@techcorp.com", phone: "+1 (555) 123-4567", org: "TechCorp Industries" },
    { id: 2, name: "John Smith", designation: "VP of HR", email: "jsmith@globalfinance.com", phone: "+1 (555) 987-6543", org: "Global Finance Group" },
    { id: 3, name: "Emily Chen", designation: "Director of Talent", email: "echen@innovatellc.com", phone: "+1 (555) 456-7890", org: "Innovate LLC" },
    { id: 4, name: "Michael Bruce", designation: "HR Manager", email: "mbruce@stark.com", phone: "+1 (555) 789-0123", org: "Stark Enterprises" },
    { id: 5, name: "Diana Prince", designation: "Chief People Officer", email: "dprince@wayne.com", phone: "+1 (555) 234-5678", org: "Wayne Corp" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your contacts and client relationships.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Contact
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Designation</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium text-gray-900">{contact.name}</TableCell>
              <TableCell>{contact.designation}</TableCell>
              <TableCell className="text-blue-600">{contact.email}</TableCell>
              <TableCell>{contact.phone}</TableCell>
              <TableCell>{contact.org}</TableCell>
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
