"use client";
import React, { useEffect, useState } from "react";
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

interface Applicant {
  applicant_id: string;
  profile_url: string;
  name: string;
  email: string;
  status: string;
  applied_at: Date;
}

interface Status {
  id: number;
  name: string;
}

interface ApplicantListProps {
  applicants: Applicant[];
}

type StatusType = "pending" | "reviewed" | "interview" | "offered" | "rejected";

const statusColors: Record<StatusType, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewed: "bg-blue-100 text-blue-800",
  interview: "bg-purple-100 text-purple-800",
  offered: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const ApplicationList = ({ applicants }: ApplicantListProps) => {
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, { id: number; type: StatusType }>>({});

  useEffect(() => {
    fetch("/api/application-status")
      .then((res) => res.json())
      .then((data) => {
        setStatusList(data.statuses);

        const initialMap: Record<number, { id: number; type: StatusType }> = {};
        applicants.forEach((a) => {
          const s = data.statuses.find((st: Status) => String(st.id) === a.status);
          initialMap[Number(a.applicant_id)] = {
            id: Number(a.status),
            type: (s?.name.toLowerCase() as StatusType) || "pending",
          };
        });
        setStatusMap(initialMap);
      })
      .catch(console.error);
  }, [applicants]);

  const handleStatusChange = async (applicant_id: number, newStatusId: number) => {
    const s = statusList.find((st) => st.id === newStatusId);
    if (!s) return;

    setStatusMap((prev) => ({
      ...prev,
      [applicant_id]: { id: newStatusId, type: s.name.toLowerCase() as StatusType },
    }));

    try {
      await fetch(`/api/applications/${applicant_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: newStatusId }),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      const original = statusMap[applicant_id];
      setStatusMap((prev) => ({ ...prev, [applicant_id]: original }));
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
        {applicants.map((student) => {
          const currentStatus = statusMap[Number(student.applicant_id)] || {
            id: Number(student.status),
            type: statusList.find(s => s.id === Number(student.status))?.name.toLowerCase() as StatusType || 'pending'
            };

          return (
            <div
              key={student.applicant_id}
              className="flex flex-col shadow-md rounded-md p-2 border border-gray-200"
            >
              <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3 md:gap-0">
                <div className="flex flex-row gap-4 items-center min-w-0">
                    {student.profile_url ? (
                  <Image
                    src={student.profile_url ?? "/assets/images/companyLogo.png"}
                    alt="studentProfile"
                    width={60}
                    height={60}
                    className="h-auto bg-white translate-y-1 shadow-md rounded-md"
                  />
                ) : (
                  <div className="w-15 h-15 bg-gray-100 translate-y-1 shadow-md rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
                    {student.name ? student.name.charAt(0).toUpperCase() : "C"}
                  </div>
                )}
                  <div className="flex flex-col">
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <p className="font-medium">{student.name}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-full sm:max-w-[200px] md:max-w-none">{student.email}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end md:justify-start">
                  <div className="w-32 flex-shrink-0">
                    <Select
                      value={String(currentStatus.id)}
                      onValueChange={(val) =>
                        handleStatusChange(Number(student.applicant_id), Number(val))
                      }
                    >
                      <SelectTrigger
                        className={`rounded-full w-full text-sm transition-all duration-200 border-none p-3 ${statusColors[currentStatus.type as StatusType]}`}
                      >
                        <SelectValue placeholder="Select status">
                            {statusList.find((st) => st.id === currentStatus.id)?.name || "Pending"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Status</SelectLabel>
                          {statusList.map((status) => (
                            <SelectItem
                                key={status.id}
                                value={status.id.toString()}
                              >
                                {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-shrink-0">
                    <StudentInfoModal applicant_id={student.applicant_id.toString()} />
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
