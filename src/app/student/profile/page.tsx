"use client";

import { useState, useEffect } from "react";
import { Student } from "@/types/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileTab from "./ProfileTab";
import DocumentsTab from "./DocumentsTab";
import ApplicationsTab from "./ApplicationsTab";
import { toast } from "sonner";
import Image from "next/image";
import { IoPersonCircleOutline, IoMailOutline, IoCallOutline, IoSchoolOutline, IoIdCardOutline } from "react-icons/io5";

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
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[#006C67] to-[#00968F] rounded-lg shadow-lg p-8 mb-8 text-white">
        <div className="flex items-center gap-6">
          {/* Profile Picture */}
          <div className="relative">
            {student.profile_url ? (
              <Image
                src={student.profile_url}
                alt={`${student.firstname} ${student.lastname}`}
                width={120}
                height={120}
                className="rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
                <IoPersonCircleOutline className="w-20 h-20 text-white" />
              </div>
            )}
          </div>

          {/* Student Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {student.firstname} {student.lastname}
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2">
                <IoIdCardOutline className="w-5 h-5" />
                <span className="text-sm">Student ID: {student.student_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoMailOutline className="w-5 h-5" />
                <span className="text-sm">{student.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoSchoolOutline className="w-5 h-5" />
                <span className="text-sm">{student.faculty}</span>
              </div>
              <div className="flex items-center gap-2">
                <IoCallOutline className="w-5 h-5" />
                <span className="text-sm">{student.phone}</span>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                Year {student.year}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
