"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "./ProfileTab";
import DocumentsTab from "./DocumentsTab";
import ApplicationsTab from "./ApplicationsTab";
import { toast } from "sonner";

export default function StudentProfilePage() {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStudentProfile = async () => {
    try {
      const res = await fetch("/api/students/[id]");
      if (!res.ok) {
        toast.error("Failed to fetch profile");
        return;
      }
      const data: Student = await res.json();
      setStudent(data);
    } catch (error) {
      console.error("Failed to fetch student profile:", error);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab student={student} onUpdate={fetchStudentProfile} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab student={student} onUpdate={fetchStudentProfile} />
        </TabsContent>

        <TabsContent value="applications">
          <ApplicationsTab studentId={student.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
