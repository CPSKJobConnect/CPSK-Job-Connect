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
import StudentInfoModal from "@/components/StudentInfoModal";
import { RecentApplicationsTableProps } from "@/types/companyStat";


type StatusType = "pending" | "reviewed" | "interviewed" | "accepted" | "rejected";

const statusColor: Record<string, string> = {
	pending: "bg-yellow-100 text-yellow-800",
	reviewed: "bg-blue-100 text-blue-800",
	interviewed: "bg-indigo-100 text-indigo-800",
	accepted: "bg-green-100 text-green-800",
	rejected: "bg-red-100 text-red-800",
};

export default function RecentApplicationsTable({ applications, loading }: RecentApplicationsTableProps) {
  const items = Array.isArray(applications) ? applications : [];

  const statusTypes: StatusType[] = ["pending", "reviewed", "interviewed", "accepted", "rejected"];
  const [statusMap, setStatusMap] = useState<Record<string, StatusType>>(
      () =>
        Object.fromEntries(
          items.map((a) => [a.applicant.id, a.status as StatusType])
        )
  );

  const handleStatus = (applicant_id: string, newStatus: StatusType) => {
    setStatusMap((prev) => ({ ...prev, [applicant_id]: newStatus }));
    setTimeout(() => {
      console.log(`(mock POST) updated applicant ${applicant_id} to "${newStatus}"`);
    }, 500);
  };

	return (
    <div className="flex flex-col rounded-md shadow-lg w-full gap-4 p-4 overflow-y-auto h-[500px]">
      <p className="text-lg font-semibold text-gray-700">Recent Applications</p>
      {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <p className="text-center text-sm">No applicants yet</p>
      </div>
    ) : (
      <div className="flex flex-col gap-2">
        <div className="flex flex-row items-center justify-between px-3 py-2 text-sm font-medium text-gray-600 shadow-md rounded-md bg-[#FFEFE5]">
          <div className="flex items-center gap-4 w-1/4 min-w-0">
            <span>Name</span>
          </div>
          <div className="w-1/4 hidden sm:block">Email</div>
          <div className="w-1/4 hidden md:block pl-6">Position</div>
          <div className="w-32">Status</div>
          <div className="w-24">Profile</div>
        </div>
        {items.map((student) => {
          const currentStatus = statusMap[student.applicant.id] || (student.status as StatusType);
          return (
            <div
              key={student.applicant.id}
              className="flex flex-row items-center justify-between px-2 py-3 hover:bg-gray-50 border-b"
            >
              <div className="flex items-center gap-4 w-1/4 min-w-0">
                {student.applicant.profile_url ? (
                  <Image
                    src={student.applicant.profile_url}
                    alt={`${student.applicant.name} profile`}
                    width={40}
                    height={40}
                    style={{ width: 40, height: 40 }}
                    className="rounded-full shadow-sm object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-full shadow-sm bg-gray-100 text-sm font-semibold text-gray-700" style={{ width: 40, height: 40 }}>
                    {`${(student.applicant.name?.[0] || "").toUpperCase()}`}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-sm font-medium text-gray-900 truncate">{student.applicant.name}</div>
                </div>
              </div>

              <div className="w-1/4 hidden sm:block truncate text-sm text-gray-600">{student.applicant.email}</div>

              <div className="w-1/4 hidden md:block text-sm text-gray-600 pl-6">{student.job.title}</div>

              <div className="w-32">
                <div className="w-32">
                  <Select
                    value={currentStatus}
                    onValueChange={(val) =>
                      handleStatus(student.applicant.id, val as StatusType)
                    }
                  >
                    <SelectTrigger
                      className={`rounded-full w-full text-sm p-1 transition-all duration-200 border-none p-2 h-[20px] w-[110px] ${statusColor[currentStatus]}`}
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
              </div>

              <div className="w-24 text-right">
                <StudentInfoModal applicant_id={student.applicant.id} size="sm" selectedJobId={student.job.id} />
              </div>
            </div>
          );
        })}
      </div>

    )}
    </div>
  );
}
