import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Plus, MoreHorizontal } from "lucide-react";

export default function OrganizationsPage() {
  const organizations = [
    { id: 1, name: "TechCorp Industries", industry: "Technology", location: "San Francisco, CA", status: "Active" },
    { id: 2, name: "Global Finance Group", industry: "Finance", location: "New York, NY", status: "Lead" },
    { id: 3, name: "Innovate LLC", industry: "Consulting", location: "Austin, TX", status: "Active" },
    { id: 4, name: "Stark Enterprises", industry: "Manufacturing", location: "Chicago, IL", status: "Inactive" },
    { id: 5, name: "Wayne Corp", industry: "Technology", location: "Gotham, NJ", status: "Lead" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client organizations and companies.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organization Name</TableHead>
            <TableHead>Industry</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations.map((org) => (
            <TableRow key={org.id}>
              <TableCell className="font-medium text-gray-900">{org.name}</TableCell>
              <TableCell>{org.industry}</TableCell>
              <TableCell>{org.location}</TableCell>
              <TableCell>
                <Badge variant={org.status === 'Active' ? 'success' : org.status === 'Lead' ? 'warning' : 'secondary'}>
                  {org.status}
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
