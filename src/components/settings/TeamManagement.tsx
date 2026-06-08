import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { getProfiles, updateProfileRole } from "@/actions";
import { Loader2, Shield } from "lucide-react";

type TeamMember = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'Admin' | 'Growth Lead' | 'Delivery Lead' | 'Analyst' | 'Developer/Admin Support' | 'Viewer';
  active: boolean;
};

const ROLES = [
  'Admin',
  'Growth Lead',
  'Delivery Lead',
  'Analyst',
  'Developer/Admin Support',
  'Viewer'
];

export default function TeamManagement() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  
  // Form state
  const [role, setRole] = useState<any>("Viewer");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getProfiles();
      setMembers(data as any);
    } catch (e: any) {
      console.error(e);
      toast.error("Failed to load team members: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (member: TeamMember) => {
    setEditing(member);
    setRole(member.role);
    setActive(member.active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await updateProfileRole(editing.id, role, active);
      toast.success("Team member configuration updated.");
      setShowModal(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update team member: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex justify-between items-center pb-2">
        <div>
          <CardTitle>Team Management</CardTitle>
          <p className="text-xs text-gray-500 font-medium mt-1">Review active directory, assign role capabilities, or suspend user access.</p>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <p className="text-gray-500 text-sm">No registered team members in database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left text-sm">
              <thead className="bg-gray-100 font-semibold text-gray-700">
                <tr>
                  <th className="border p-3">Name</th>
                  <th className="border p-3">Email Address</th>
                  <th className="border p-3">Access Role</th>
                  <th className="border p-3">System Status</th>
                  <th className="border p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="font-medium text-gray-700 divide-y">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="border p-3 font-semibold text-gray-900">
                      {m.first_name || m.last_name ? `${m.first_name || ''} ${m.last_name || ''}` : '--'}
                    </td>
                    <td className="border p-3">{m.email}</td>
                    <td className="border p-3">
                      <Badge variant="outline" className="flex items-center gap-1 w-max font-semibold">
                        <Shield className="h-3 w-3 text-blue-500" /> {m.role}
                      </Badge>
                    </td>
                    <td className="border p-3">
                      <Badge variant={m.active ? "success" : "destructive"}>
                        {m.active ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="border p-3">
                      <Button variant="outline" size="sm" onClick={() => openEdit(m)}>
                        Manage Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && editing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Manage Access: {editing.first_name || editing.email}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Access Role Capability</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="border rounded-xl p-2.5 w-full bg-white text-sm"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">System Account Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center text-sm cursor-pointer select-none">
                      <input 
                        type="radio" name="active" checked={active === true} 
                        onChange={() => setActive(true)}
                        className="mr-2"
                      /> Enable Access
                    </label>
                    <label className="flex items-center text-sm cursor-pointer select-none">
                      <input 
                        type="radio" name="active" checked={active === false} 
                        onChange={() => setActive(false)}
                        className="mr-2"
                      /> Suspend User
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2 border-t">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
