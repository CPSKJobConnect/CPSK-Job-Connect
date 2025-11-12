"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useEffect, useState } from "react";
import { begin, done } from "@/lib/loaderSignal";
import { IoBriefcaseOutline, IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer } from "react-icons/md";
import { toast } from "sonner";
import ApplicationSearchBar from "./ApplicationSearchBar";

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
  const [filteredApplications, setFilteredApplications] = useState<Application[]>(applications);
  const [recentApplied, setRecentApplied] = useState<{ jobId: number; appliedAt: number } | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      begin();
      try {
        const res = await fetch("/api/students/applications");
        if (!res.ok) {
          toast.error("Failed to fetch applications");
          return;
        }
        const data = await res.json();
        console.log("app", data);
        setApplications(data);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        toast.error("Error loading applications");
      } finally {
        done();
      }
    };

    fetchApplications();
  }, [studentId]);

  useEffect(() => {
    setFilteredApplications(applications);
  }, [applications]);

  useEffect(() => {
    let timeoutId: number | undefined;
    try {
      const raw = localStorage.getItem("recentlyApplied");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.jobId || !parsed.appliedAt) return;

      const age = Date.now() - parsed.appliedAt;
      const ONE_HOUR = 60 * 60 * 1000;
      if (age >= ONE_HOUR) {
        localStorage.removeItem("recentlyApplied");
        setRecentApplied(null);
        return;
      }

      setRecentApplied({ jobId: parsed.jobId, appliedAt: parsed.appliedAt });

      timeoutId = window.setTimeout(() => {
        localStorage.removeItem("recentlyApplied");
        setRecentApplied(null);
      }, ONE_HOUR - age);
    } catch (err) {
      console.warn("Failed to read recentlyApplied marker", err);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // Rely on global loader; render nothing locally until data arrives
  if (!applications) return null;

  return (
    <div className="mx-auto px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-900">Application History</h1>
          <p className="text-sm text-gray-600">Track your job applications and their status</p>
        </div>
      </div>
      {applications.length === 0 ? (
        <div className="text-center py-12">
          <IoBriefcaseOutline className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No applications yet</p>
          <p className="text-gray-400 text-sm mt-2">Start applying to jobs to see them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-full">
          <ApplicationSearchBar applications={applications} setFilteredApplications={setFilteredApplications} />
        </div>
          {filteredApplications.map((application) => {
            const isRecent = Boolean(
              recentApplied && application.job?.id === recentApplied.jobId && Date.now() - recentApplied.appliedAt < 60 * 60 * 1000
            );
            const recentMinutes = isRecent && recentApplied ? Math.floor((Date.now() - recentApplied.appliedAt) / 60000) : null;

            return (
            <div
              key={application.id}
              className={`border rounded-lg p-5 hover:shadow-md transition ${isRecent ? 'bg-yellow-50 border-yellow-200' : 'border-gray-200'}`}
            >
                <div className="flex items-start gap-4">
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

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.job.jobName}
                        </h3>
                        <p className="text-gray-600">{application.job.company.name}</p>
                        {isRecent && recentMinutes !== null && (
                          <p className="text-xs text-green-700 mt-1">
                            You applied {recentMinutes <= 1 ? "just now" : `${recentMinutes} minutes ago`}
                          </p>
                        )}
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

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Submitted documents:</p>
                      <div className="flex flex-col md:flex-row gap-2 text-xs">
                        {application.documents.resume && (
                          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded truncate max-w-[200px] md:max-w-none md:overflow-visible md:whitespace-normal">
                            Resume: {application.documents.resume.file_name}
                          </span>
                        )}
                        {application.documents.portfolio && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded truncate max-w-[200px] md:max-w-none md:overflow-visible md:whitespace-normal">
                            Portfolio: {application.documents.portfolio.file_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
    </div>
  );
}
