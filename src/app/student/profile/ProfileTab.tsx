"use client";

import { useState, useRef } from "react";
import { Student } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { IoPersonOutline, IoIdCardOutline, IoMailOutline, IoCallOutline, IoSchoolOutline, IoShieldCheckmarkOutline, IoSave, IoClose, IoCamera, IoPersonCircleOutline } from "react-icons/io5";
import Image from "next/image";
import { isValidImageUrl } from "@/lib/validateImageUrl";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ProfileTabProps {
  student: Student;
  onUpdate: () => void;
}

export default function ProfileTab({ student, onUpdate }: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstname: student.firstname,
    lastname: student.lastname,
    faculty: student.faculty,
    year: student.year,
    phone: student.phone,
  });

  // Image upload refs and previews
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { data: session, update: updateSession } = useSession();

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setLogoPreview(reader.result as string);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const getStatusColor = (status: string, emailVerified: boolean) => {
    // For alumni who are approved but haven't verified email, show blue (pending email verification)
    if (status === "APPROVED" && student.student_status === "ALUMNI" && !emailVerified) {
      return "bg-blue-100 text-blue-800 border-blue-300";
    }

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

  const getStatusText = (status: string, emailVerified: boolean) => {
    // For alumni who are approved but haven't verified email
    if (status === "APPROVED" && student.student_status === "ALUMNI" && !emailVerified) {
      return "Email Verification Required";
    }

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

  const handleSave = async () => {
    // Validation
    if (formData.firstname.trim().length < 2) {
      toast.error("First name must be at least 2 characters");
      return;
    }
    if (formData.lastname.trim().length < 2) {
      toast.error("Last name must be at least 2 characters");
      return;
    }
    if (formData.phone && !/^\d{10,}$/.test(formData.phone)) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }

    setIsSaving(true);

    try {
      // If there's a profile image, upload it separately first
      if (logoFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", logoFile);

        const imageRes = await fetch("/api/students/profile-image", {
          method: "POST",
          body: imageFormData,
        });

        if (!imageRes.ok) {
          const error = await imageRes.json();
          toast.error(error.error || "Failed to upload profile image");
          setIsSaving(false);
          return;
        }

        const imageData = await imageRes.json();

        // Update session with new logoUrl
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            logoUrl: imageData.profile_url,
          },
        });
      }

      // Update other profile fields
      const res = await fetch("/api/students/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${formData.firstname} ${formData.lastname}`,
          faculty: formData.faculty,
          year: formData.year,
          phone: formData.phone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("❌ Update failed:", errorData);
        toast.error(errorData.error || "Failed to update profile");
        return;
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      setLogoPreview(null);
      setLogoFile(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstname: student.firstname,
      lastname: student.lastname,
      faculty: student.faculty,
      year: student.year,
      phone: student.phone,
    });
    setLogoPreview(null);
    setLogoFile(null);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              {isEditing ? "Edit your student profile details" : "View your student profile details"}
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
        {/* Profile Image Section */}
        {isEditing && (
          <div className="space-y-4 pb-6 border-b">
            <h3 className="text-sm font-medium">Profile Image</h3>

            {/* Profile Image Upload */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100">
                  {logoPreview || isValidImageUrl(student.profile_url) ? (
                    <Image
                      src={logoPreview || student.profile_url!}
                      alt="Profile Picture"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IoPersonCircleOutline className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    <IoCamera className="w-4 h-4 mr-2" />
                    Change Picture
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
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
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(student.verification_status, student.email_verified)}`}>
              {getStatusText(student.verification_status, student.email_verified)}
            </span>
          </div>
        </div>

        {/* Student Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student ID (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoIdCardOutline className="w-4 h-4" />
              <span>Student ID</span>
            </Label>
            <p className="text-base text-gray-900 pl-6">{student.student_id}</p>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoMailOutline className="w-4 h-4" />
              <span>Email</span>
            </Label>
            <p className="text-base text-gray-900 pl-6">{student.email}</p>
          </div>

          {/* First Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoPersonOutline className="w-4 h-4" />
              <span>First Name</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.firstname}
                onChange={(e) => handleChange("firstname", e.target.value)}
                placeholder="Enter first name"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{student.firstname}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoPersonOutline className="w-4 h-4" />
              <span>Last Name</span>
            </Label>
            {isEditing ? (
              <Input
                value={formData.lastname}
                onChange={(e) => handleChange("lastname", e.target.value)}
                placeholder="Enter last name"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{student.lastname}</p>
            )}
          </div>

          {/* Faculty */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoSchoolOutline className="w-4 h-4" />
              <span>Faculty</span>
            </Label>
            {isEditing ? (
              <Select
                value={formData.faculty}
                onValueChange={(value) => handleChange("faculty", value)}
              >
                <SelectTrigger className="pl-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Software and Knowledge Engineering (SKE)">
                    Software and Knowledge Engineering (SKE)
                  </SelectItem>
                  <SelectItem value="Computer Engineering (CPE)">
                    Computer Engineering (CPE)
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-base text-gray-900 pl-6">{student.faculty}</p>
            )}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <IoSchoolOutline className="w-4 h-4" />
              <span>Year</span>
            </Label>
            {isEditing ? (
              <Select
                value={String(formData.year)}
                onValueChange={(value) => handleChange("year", value === "Alumni" ? value : parseInt(value))}
              >
                <SelectTrigger className="pl-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      Year {year}
                    </SelectItem>
                  ))}
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="text-base text-gray-900 pl-6">
                {student.year === "Alumni" ? "Alumni" : `Year ${student.year}`}
              </p>
            )}
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
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter phone number"
                className="pl-6"
              />
            ) : (
              <p className="text-base text-gray-900 pl-6">{student.phone}</p>
            )}
          </div>
        </div>

        {/* Status-specific messages */}
        {!isEditing && student.verification_status === "PENDING" && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm font-semibold text-blue-900">Verification In Progress</p>
            <p className="text-sm text-blue-800 mt-1">
              Your student registration is currently under review by our admin team. You will receive a notification once the verification is complete.
            </p>
          </div>
        )}

        {!isEditing && student.verification_status === "REJECTED" && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <p className="text-sm font-semibold text-red-900">Verification Rejected</p>
            <p className="text-sm text-red-800 mt-1">
              Your student verification was not approved. Please upload new documents in the Documents tab to re-apply for verification.
            </p>
          </div>
        )}

        {!isEditing && student.verification_status === "APPROVED" && student.student_status === "ALUMNI" && !student.email_verified && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Admin Approval Complete - Email Verification Required</p>
                <p className="text-sm text-blue-800 mt-1">
                  Your alumni status has been approved by an admin! Please verify your KU email to complete registration and start applying for jobs.
                </p>
              </div>
              <Link href={`/student/verify-email?email=${encodeURIComponent(student.email)}`}>
                <Button className="ml-4 bg-blue-600 hover:bg-blue-700">
                  Verify Email
                </Button>
              </Link>
            </div>
          </div>
        )}

        {!isEditing && student.verification_status === "APPROVED" && student.email_verified && (
          <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <p className="text-sm font-semibold text-green-900">Student Verified</p>
            <p className="text-sm text-green-800 mt-1">
              Your student account has been successfully verified. You can now apply for jobs and manage your applications.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
