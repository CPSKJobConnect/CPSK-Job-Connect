"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import { IoBriefcaseOutline, IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { toast } from "sonner";
import { date } from "zod";

interface Application {
  id: number;
  status: string;
  applied_at: string;
  updated_at: string;
  job: {
    id: number;
    jobName: string;
    location: string;
    jobType: string;
    jobArrangement: string;
    min_salary: number;
    max_salary: number;
    deadline: string;
    company: {
      id: number;
      name: string;
      logoUrl: string | null;
    };
  };
  documents: {
    resume: {
      id: number;
      file_name: string;
      file_path: string;
    } | null;
    portfolio: {
      id: number;
      file_name: string;
      file_path: string;
    } | null;
  };
}

interface ApplicationsTabProps {
  studentId: number;
}

const statusColors: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Reviewed: "bg-blue-100 text-blue-800 border-blue-200",
  Interview: "bg-purple-100 text-purple-800 border-purple-200",
  Offered: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function ApplicationsTab({ studentId }: ApplicationsTabProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await fetch("/api/students/applications");
        if (!res.ok) {
          toast.error("Failed to fetch applications");
          return;
        }
        const data = await res.json();
        setApplications(data);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        toast.error("Error loading applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [studentId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">Loading applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application History</CardTitle>
        <CardDescription>Track your job applications and their status</CardDescription>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <IoBriefcaseOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No applications yet</p>
            <p className="text-gray-400 text-sm mt-2">Start applying to jobs to see them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
              >
                <div className="flex items-start gap-4">
                  {/* Company Logo */}
                  <div className="flex-shrink-0">
                    {application.job.company.logoUrl ? (
                      <Image
                        src={application.job.company.logoUrl}
                        alt={application.job.company.name}
                        width={60}
                        height={60}
                        className="rounded-lg border border-gray-200"
                      />
                    ) : (
                      <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                        <IoBriefcaseOutline className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Job Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.job.jobName}
                        </h3>
                        <p className="text-gray-600">{application.job.company.name}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          statusColors[application.status] || "bg-gray-100 text-gray-800 border-gray-200"
                        }`}
                      >
                        {application.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <IoLocationOutline className="w-4 h-4" />
                        <span>{application.job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <IoBriefcaseOutline className="w-4 h-4" />
                        <span>{application.job.jobType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MdOutlineTimer className="w-4 h-4" />
                        <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {application.job.jobArrangement}
                      </span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        ฿{application.job.min_salary.toLocaleString()} - ฿
                        {application.job.max_salary.toLocaleString()}
                      </span>
                    </div>

                    {/* Submitted Documents */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Submitted documents:</p>
                      <div className="flex gap-2 text-xs">
                        {application.documents.resume && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            Resume: {application.documents.resume.file_name}
                          </span>
                        )}
                        {application.documents.portfolio && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                            Portfolio: {application.documents.portfolio.file_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
