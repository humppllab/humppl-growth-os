import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";

export default function UserProfile() {
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 555-1234",
    password: "",
    profilePic: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    toast.success("User profile saved");
    console.log("Saved profile", profile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Edit personal information and password.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" name="firstName" value={profile.firstName} onChange={handleChange} />
          <Input label="Last Name" name="lastName" value={profile.lastName} onChange={handleChange} />
          <Input label="Email" name="email" type="email" value={profile.email} onChange={handleChange} />
          <Input label="Phone" name="phone" value={profile.phone} onChange={handleChange} />
        </div>
        <div className="border-t pt-4">
          <Input label="Change Password" name="password" type="password" value={profile.password} onChange={handleChange} placeholder="New password" />
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </CardContent>
    </Card>
  );
}
