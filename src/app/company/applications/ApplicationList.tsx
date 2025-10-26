"use client";
import React, { useState } from "react";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StudentInfoModal from "./StudentInfoModal";
import { Application } from "@/types/job";

interface ApplicantListProps {
  job_id: number;
  applicants: Application[];
}

type StatusType = "pending" | "reviewed" | "interviewed" | "accepted" | "rejected";

const statusColors: Record<StatusType, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  interviewed: "bg-purple-100 text-purple-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationList = ({ job_id, applicants }: ApplicantListProps) => {
  const statusTypes: StatusType[] = ["pending", "reviewed", "interviewed", "accepted", "rejected"];
  const [statusMap, setStatusMap] = useState<Record<number, StatusType>>(
    () =>
      Object.fromEntries(
        applicants.map((a) => [a.id, a.status.name as StatusType])
      )
  );

  const handleStatus = async (applicationId: number, newStatus: StatusType) => {
    // Optimistic update
    setStatusMap((prev) => ({ ...prev, [applicationId]: newStatus }));

    try {
      // TODO: Call API to update status
      const response = await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      console.log(`✅ Updated application ${applicationId} to "${newStatus}"`);
    } catch (error) {
      console.error('❌ Error updating status:', error);
      // Revert on error
      const originalStatus = applicants.find(a => a.id === applicationId)?.status.name as StatusType;
      setStatusMap((prev) => ({ ...prev, [applicationId]: originalStatus }));
    }
  };

  return (
    <div className="flex flex-col rounded-md shadow-md w-full gap-4 p-4 overflow-y-auto">
      <p className="text-lg font-semibold text-gray-700">Student Applications</p>
      {applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <p className="text-center text-sm">No applicants yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {applicants.map((application) => {
            const currentStatus = statusMap[application.id] || (application.status.name as StatusType);

            return (
              <div
                key={application.id}
                className="flex flex-col shadow-md rounded-md p-2 border border-gray-200"
              >
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row gap-4 items-center">
                    <Image
                      src={application.studentProfilePic || "/default-avatar.png"}
                      alt={application.studentName}
                      width={60}
                      height={60}
                      className="rounded-full shadow-md"
                    />
                    <div className="flex flex-col">
                      <p className="font-medium">{application.studentName}</p>
                      <p className="text-sm text-gray-500">{application.studentEmail}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-5">
                    <div className="w-25">
                      <Select
                        value={currentStatus}
                        onValueChange={(val) =>
                          handleStatus(application.id, val as StatusType)
                        }
                      >
                        <SelectTrigger
                          className={`rounded-full w-full text-sm transition-all duration-200 border-none p-3 ${statusColors[currentStatus]}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Status</SelectLabel>
                            {statusTypes.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <StudentInfoModal applicant_id={application.id.toString()} />
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
};

export default ApplicationList;
