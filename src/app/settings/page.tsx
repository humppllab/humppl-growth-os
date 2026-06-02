'use client'

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { getProfile, updateProfile } from "@/actions";

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const profile = await getProfile();
        if (profile) {
          setFirstName(profile.first_name || "");
          setLastName(profile.last_name || "");
          setEmail(profile.email || "");
          setCompanyName(profile.company_name || "");
        }
      } catch (err) {
        console.error("Failed to load profile settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const updated = await updateProfile(firstName, lastName, email, companyName);
      if (updated) {
        setSuccess("Profile settings saved successfully.");
      }
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and platform preferences.</p>
      </div>

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information and email preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">First Name</label>
                  <input 
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                    placeholder="Alex" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Last Name</label>
                  <input 
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                    placeholder="Doe" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                  placeholder="alex@humppl.com" 
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" /> Saving...
                  </>
                ) : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Manage your company details and team members.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Company Name</label>
                <input 
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent" 
                  placeholder="Humppl" 
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} variant="outline">
                {saving ? "Saving..." : "Save Company Details"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
