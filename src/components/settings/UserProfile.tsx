import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { getProfile, updateProfile } from "@/actions";
import { Loader2 } from "lucide-react";

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "Humppl Private Limited",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        if (data) {
          setProfile({
            firstName: data.first_name || "",
            lastName: data.last_name || "",
            email: data.email || "",
            companyName: data.company_name || "Humppl Private Limited",
          });
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(
        profile.firstName,
        profile.lastName,
        profile.email,
        profile.companyName
      );
      toast.success("User profile saved successfully.");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Edit personal information and company name.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={profile.email} onChange={handleChange} />
          <Input label="Company Name" name="companyName" value={profile.companyName} onChange={handleChange} />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving Changes..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
