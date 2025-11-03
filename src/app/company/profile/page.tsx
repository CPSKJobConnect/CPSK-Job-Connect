"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IoCallOutline, IoCameraOutline, IoGlobeOutline, IoMailOutline, IoBusinessOutline, IoLocationOutline } from "react-icons/io5";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import CompanyProfileTab from "./CompanyProfileTab";
import CompanyJobPosts from "./CompanyJobPostTab";

interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  description: string;
  logo_url?: string;
  background_url?: string;
}

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
        toast.error("Failed to fetch company profile");
        return;
      }
      const data: Company = await res.json();
      setCompany(data);
    } catch (error) {
      console.error("Error fetching company profile:", error);
      toast.error("Error loading company profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/company/profile/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || "Failed to upload logo");
        return;
      }

      const data = await res.json();
      toast.success("Logo updated successfully");

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          logo_url: data.logo_url,
        },
      });

      await fetchCompanyProfile();
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Error uploading logo");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );

  if (!company)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#006C67] to-[#00968F] rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="relative group">
            {company.logo_url ? (
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg overflow-hidden">
                <Image
                  src={company.logo_url}
                  alt={company.name}
                  width={120}
                  height={120}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                <IoBusinessOutline className="w-20 h-20 text-white" />
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 w-[120px] h-[120px] rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
              title="Change company logo"
            >
              {uploadingImage ? (
                <div className="text-white text-sm">Uploading...</div>
              ) : (
                <IoCameraOutline className="w-10 h-10 text-white" />
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{company.name}</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <IoMailOutline className="w-5 h-5" />
                <span className="text-sm">{company.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoCallOutline className="w-5 h-5" />
                <span className="text-sm">{company.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoLocationOutline className="w-5 h-5" />
                <span className="text-sm">{company.location || "No address provided"}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoGlobeOutline className="w-5 h-5" />
                <span className="text-sm">{company.website || "No website"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="posts">Job Posts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <CompanyProfileTab company={company} onUpdate={fetchCompanyProfile} />
        </TabsContent>

        <TabsContent value="posts">
          <CompanyJobPosts companyId={company.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
