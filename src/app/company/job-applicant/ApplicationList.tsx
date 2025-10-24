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

interface Applicant {
  applicant_id: string;
  profile_url: string;
  firstname: string;
  lastname: string;
  email: string;
  status: string;
  applied_at: Date;
}

interface ApplicantListProps {
  job_id: number | null;
  applicants: Applicant[];
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
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>(
    () =>
      Object.fromEntries(
        applicants.map((a) => [a.applicant_id, a.status as StatusType])
      )
  );

  const handleStatus = (applicant_id: string, newStatus: StatusType) => {
    setStatusMap((prev) => ({ ...prev, [applicant_id]: newStatus }));
    setTimeout(() => {
      console.log(`(mock POST) updated applicant ${applicant_id} to "${newStatus}"`);
    }, 500);
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
        {applicants.map((student) => {
          const currentStatus = statusMap[student.applicant_id] || (student.status as StatusType);

          return (
            <div
              key={student.applicant_id}
              className="flex flex-col shadow-md rounded-md p-2 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 md:gap-0">
                <div className="flex flex-row gap-4 items-center min-w-0">
                  <Image
                    src={student.profile_url}
                    alt="studentProfile"
                    width={60}
                    height={60}
                    className="rounded-full shadow-md"
                  />
                  <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <p className="font-medium">{student.firstname}</p>
                      <p className="font-medium">{student.lastname}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-full sm:max-w-[200px] md:max-w-none">{student.email}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end md:justify-start">
                  <div className="w-32 flex-shrink-0">
                    <Select
                      value={currentStatus}
                      onValueChange={(val) =>
                        handleStatus(student.applicant_id, val as StatusType)
                      }
                    >
                      <SelectTrigger
                        className={`rounded-full w-full text-sm p-1 transition-all duration-200 border-none p-3 ${statusColors[currentStatus]}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {statusTypes.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-shrink-0">
                    <StudentInfoModal applicant_id={student.applicant_id} />
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
