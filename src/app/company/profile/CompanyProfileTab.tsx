"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Company {
  id: string;
  name: string;
  location: string;
  website: string;
  phone: string;
  description: string;
}

interface CompanyProfileTabProps {
  company: Company;
  onUpdate: () => void;
}

export default function CompanyProfileTab({ company, onUpdate }: CompanyProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(company);

  const handleChange = (field: keyof Company, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/company/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        toast.error("Failed to update company profile");
        return;
      }

      toast.success("Company profile updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating company:", error);
      toast.error("Error updating profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>View and edit your company information.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={formData.name ?? ""}
                onChange={(e) => handleChange("name", e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location ?? ""}
                onChange={(e) => handleChange("location", e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website ?? ""}
                onChange={(e) => handleChange("website", e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="number"
                inputMode="numeric"
                value={formData.phone ?? ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={!isEditing}
                className={!isEditing ? "bg-gray-50" : ""}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description ?? ""}
              onChange={(e) => handleChange("description", e.target.value)}
              disabled={!isEditing}
              className={`w-full p-2 border rounded-md ${!isEditing ? "bg-gray-50" : ""}`}
              rows={5}
            />
          </div>

          {isEditing ? (
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
