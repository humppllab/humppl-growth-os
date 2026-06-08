import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Executive" | "Viewer";
};

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [form, setForm] = useState<{ name: string; email: string; role: "Admin" | "Manager" | "Executive" | "Viewer" }>({ name: "", email: "", role: "Viewer" });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('team_members')
      if (stored) setMembers(JSON.parse(stored))
    } catch (e) {
      console.error(e)
    }
  }, [])

  const saveMembers = () => {
    try {
      localStorage.setItem('team_members', JSON.stringify(members))
      toast.success('Team members saved')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save team members')
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", role: "Viewer" });
    setShowModal(true);
  };
  const openEdit = (member: TeamMember) => {
    setEditing(member);
    setForm({ name: member.name, email: member.email, role: member.role });
    setShowModal(true);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      setMembers(prev =>
        prev.map(m => (m.id === editing.id ? { ...m, ...form } : m))
      );
      toast.success("Team member updated");
    } else {
      const newMember: TeamMember = {
        id: Date.now().toString(),
        name: form.name,
        email: form.email,
        role: form.role,
      };
      setMembers(prev => [...prev, newMember]);
      toast.success("Team member added");
    }
    setShowModal(false);
  };
  const handleDelete = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    toast.success("Team member removed");
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Team Management</CardTitle>
        <div className="flex items-center space-x-2">
          <Button onClick={openAdd}>Add Member</Button>
          <Button variant="outline" onClick={saveMembers}>Save Changes</Button>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-gray-500">No team members.</p>
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Role</th>
                <th className="border p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.id}>
                  <td className="border p-2">{m.name}</td>
                  <td className="border p-2">{m.email}</td>
                  <td className="border p-2">{m.role}</td>
                  <td className="border p-2 space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(m.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded p-6 w-96">
              <h3 className="text-lg font-medium mb-4">
                {editing ? "Edit Member" : "Add Member"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <Input label="Name" name="name" value={form.name} onChange={handleChange} required />
                <Input label="Email" name="email" type="email" value={form.email} onChange={handleChange} required />
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="border rounded p-2 w-full"
                >
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Executive">Executive</option>
                  <option value="Viewer">Viewer</option>
                </select>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
