"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Company } from "@/types/user";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoBusinessOutline, IoCallOutline, IoCameraOutline, IoLocationOutline, IoMailOutline } from "react-icons/io5";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import DocumentsTab from "./DocumentsTab";
import ProfileTab from "./ProfileTab";

export default function CompanyProfilePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session, update: updateSession } = useSession();

  const fetchCompanyProfile = async () => {
    try {
      const res = await fetch("/api/company/profile");
      if (!res.ok) {
        toast.error("Failed to fetch profile");
        return;
      }
      const data: Company = await res.json();
      setCompany(data);
    } catch (error) {
      console.error("Failed to fetch company profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/company/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to upload profile image");
        return;
      }

      const data = await res.json();

      toast.success("Profile image updated successfully");

      // Update the session with new logoUrl to refresh navbar
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          logoUrl: data.profile_url,
        },
      });

      await fetchCompanyProfile();
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast.error("Error uploading profile image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#006C67] to-[#00968F] rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center gap-6">
          {/* Profile Picture */}
          <div className="relative group">
            {company.profile_url && typeof company.profile_url === 'string' && company.profile_url.trim() !== "" && company.profile_url.startsWith('http') ? (
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                <Image
                  src={company.profile_url}
                  alt={company.name}
                  width={120}
                  height={120}
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                <IoBusinessOutline className="w-20 h-20 text-white" />
              </div>
            )}

            {/* Upload Button Overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 w-[120px] h-[120px] rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              title="Change profile picture"
            >
              {uploadingImage ? (
                <div className="text-white text-sm">Uploading...</div>
              ) : (
                <IoCameraOutline className="w-10 h-10 text-white" />
              )}
            </button>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageUpload}
              className="hidden"
            />
          </div>

          {/* Company Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <IoMailOutline className="w-5 h-5" />
                <span className="text-sm">{company.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoCallOutline className="w-5 h-5" />
                <span className="text-sm">{company.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoLocationOutline className="w-5 h-5" />
                <span className="text-sm">{company.address.join(", ")}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                company.registration_status === "APPROVED"
                  ? "bg-green-500/30 backdrop-blur-sm"
                  : company.registration_status === "PENDING"
                  ? "bg-yellow-500/30 backdrop-blur-sm"
                  : "bg-red-500/30 backdrop-blur-sm"
              }`}>
                {company.registration_status === "APPROVED"
                  ? "Verified Company"
                  : company.registration_status === "PENDING"
                  ? "Verification Pending"
                  : "Verification Rejected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab company={company} onProfileUpdate={fetchCompanyProfile} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab company={company} onUpdate={fetchCompanyProfile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
