"use client";

import { Company } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IoBusinessOutline, IoCallOutline, IoGlobeOutline, IoLocationOutline, IoMailOutline, IoShieldCheckmarkOutline, IoCamera, IoSave, IoClose } from "react-icons/io5";
import { useState, useRef } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/validateImageUrl";
import { useSession } from "next-auth/react";

interface ProfileTabProps {
  company: Company;
  onProfileUpdate?: () => void;
}

export default function ProfileTab({ company, onProfileUpdate }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: session, update: updateSession } = useSession();

  // Form state
  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address[0] || "",
    phone: company.phone,
    description: company.description,
    website: company.department[0] || "", // Using department[0] as website placeholder
  });

  // Image upload refs and previews
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border-green-300";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Verified";
      case "PENDING":
        return "Verification Pending";
      case "REJECTED":
        return "Verification Rejected";
      default:
        return status;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "background") => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "logo") {
          setLogoPreview(reader.result as string);
          setLogoFile(file);
        } else {
          setBackgroundPreview(reader.result as string);
          setBackgroundFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validation
    if (formData.name.trim().length < 3) {
      toast.error("Company name must be at least 3 characters");
      return;
    }
    if (formData.phone && !/^\d{10,}$/.test(formData.phone)) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }
    if (formData.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setIsSaving(true);
    try {
      const form = new FormData();
      form.append("name", formData.name.trim());
      form.append("address", formData.address.trim());
      form.append("phone", formData.phone.trim());
      form.append("description", formData.description.trim());
      form.append("website", formData.website.trim());

      if (logoFile) {
        form.append("logo", logoFile);
      }
      if (backgroundFile) {
        form.append("background", backgroundFile);
      }

      const response = await fetch("/api/company/profile", {
        method: "PATCH",
        body: form,
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Profile updated successfully");

        // Update session if logo or background was changed
        if (logoFile || backgroundFile) {
          await updateSession({
            user: {
              ...session?.user,
              logoUrl: data.logoUrl,
              backgroundUrl: data.backgroundUrl,
            },
          });
        }

        setIsEditing(false);
        setLogoPreview(null);
        setBackgroundPreview(null);
        setLogoFile(null);
        setBackgroundFile(null);
        onProfileUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: company.name,
      address: company.address[0] || "",
      phone: company.phone,
      description: company.description,
      website: company.department[0] || "",
    });
    setLogoPreview(null);
    setBackgroundPreview(null);
    setLogoFile(null);
    setBackgroundFile(null);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit your company profile details" : "View your company profile details"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <IoClose className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  <IoSave className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Images Section */}
        {isEditing && (
          <div className="space-y-4 pb-6 border-b">
            <h3 className="text-sm font-medium">Profile Images</h3>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Company Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {logoPreview || isValidImageUrl(company.profile_url) ? (
                    <Image
                      src={logoPreview || company.profile_url!}
                      alt="Company Logo"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoBusinessOutline className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "logo")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <IoCamera className="w-4 h-4 mr-2" />
                    Change Logo
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Background Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Background Image</Label>
              <div className="flex items-start gap-4">
                <div className="relative w-48 h-24 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {backgroundPreview || isValidImageUrl(company.bg_profile_url) ? (
                    <Image
                      src={backgroundPreview || company.bg_profile_url!}
                      alt="Background"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoCamera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "background")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => backgroundInputRef.current?.click()}
                  >
                    <IoCamera className="w-4 h-4 mr-2" />
                    Change Background
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB. Recommended: 1200x400px
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Verification Status */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <IoShieldCheckmarkOutline className="w-6 h-6 text-gray-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">Verification Status</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(company.registration_status)}`}>
              {getStatusText(company.registration_status)}
            </span>
          </div>
        </div>

        {/* Company Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoBusinessOutline className="w-4 h-4" />
              <span>Company Name</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter company name"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{company.name}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoMailOutline className="w-4 h-4" />
              <span>Email</span>
            </Label>
            <p className="text-base text-gray-900 pl-6">{company.email}</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoCallOutline className="w-4 h-4" />
              <span>Phone</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{company.phone}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoLocationOutline className="w-4 h-4" />
              <span>Address</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{company.address.join(", ")}</p>
            )}
          </div>

          {/* Website */}
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoGlobeOutline className="w-4 h-4" />
              <span>Website (Optional)</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">
                {company.department[0] || "Not provided"}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2 pt-4 border-t">
          <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <IoGlobeOutline className="w-4 h-4" />
            <span>Company Description</span>
          </Label>
          {isEditing ? (
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your company..."
              className="pl-6 min-h-[120px]"
              rows={5}
            />
          ) : (
            <p className="text-base text-gray-900 pl-6 whitespace-pre-wrap">{company.description}</p>
          )}
        </div>

        {/* Status-specific messages */}
        {!isEditing && company.registration_status === "PENDING" && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm font-semibold text-blue-900">Verification In Progress</p>
            <p className="text-sm text-blue-800 mt-1">
              Your company registration is currently under review by our admin team. You will receive a notification once the verification is complete.
            </p>
          </div>
        )}

        {!isEditing && company.registration_status === "REJECTED" && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm font-semibold text-red-900">Verification Rejected</p>
            <p className="text-sm text-red-800 mt-1">
              Your company verification was not approved. Please upload new evidence documents in the Documents tab to re-apply for verification.
            </p>
          </div>
        )}

        {!isEditing && company.registration_status === "APPROVED" && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm font-semibold text-green-900">Company Verified</p>
            <p className="text-sm text-green-800 mt-1">
              Your company has been successfully verified. You can now post jobs and manage applications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
