import { Button } from "@/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Plus, MoreHorizontal, FileText, Link as LinkIcon, FileImage } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
  const documents = [
    { id: 1, name: "HR Transformation Pitch Deck", type: "Presentation", client: "TechCorp", date: "Oct 12, 2024", size: "2.4 MB" },
    { id: 2, name: "Innovate LLC MSA 2024", type: "Agreement", client: "Innovate LLC", date: "Oct 10, 2024", size: "1.1 MB" },
    { id: 3, name: "Project Delivery Folder", type: "Drive Link", client: "Stark Enterprises", date: "Oct 15, 2024", size: "--" },
    { id: 4, name: "Executive Search Contract", type: "Agreement", client: "Global Finance", date: "Oct 05, 2024", size: "850 KB" },
    { id: 5, name: "Company Profile Overview", type: "Proposal Deck", client: "General", date: "Sep 28, 2024", size: "5.2 MB" },
  ];

  const getIcon = (type: string) => {
    switch(type) {
      case 'Presentation':
      case 'Proposal Deck': return <FileImage className="mr-3 h-5 w-5 text-blue-500" />;
      case 'Drive Link': return <LinkIcon className="mr-3 h-5 w-5 text-indigo-500" />;
      case 'Agreement': return <FileText className="mr-3 h-5 w-5 text-emerald-500" />;
      default: return <FileText className="mr-3 h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and access all client files and agreements.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Date Uploaded</TableHead>
            <TableHead>Size</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium text-gray-900 flex items-center">
                {getIcon(doc.type)}
                {doc.name}
              </TableCell>
              <TableCell>{doc.type}</TableCell>
              <TableCell>{doc.client}</TableCell>
              <TableCell>{doc.date}</TableCell>
              <TableCell>{doc.size}</TableCell>
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
