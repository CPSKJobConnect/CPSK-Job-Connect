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
  job_id: number | null;
  applicants: Applicant[];
}

type StatusType = "Pending" | "Reviewed" | "Interview" | "Offered" | "Rejected";

const statusColors: Record<StatusType, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Reviewed: "bg-blue-100 text-blue-800",
  Interview: "bg-purple-100 text-purple-800",
  Offered: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const ApplicationList = ({ job_id, applicants }: ApplicantListProps) => {
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusMap, setStatusMap] = useState<Record<number, { id: number; type: StatusType }>>({});

  useEffect(() => {
    fetch("/api/application-status")
      .then((res) => res.json())
      .then((data) => {
        setStatusList(data.statuses);

        const initialMap: Record<number, { id: number; type: StatusType }> = {};
        applicants.forEach((a) => {
          const s = data.statuses.find((st: Status) => st.id === a.status);
          initialMap[a.applicant_id] = {
            id: a.status,
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
                      <p className="font-medium">{student.name}</p>
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-full sm:max-w-[200px] md:max-w-none">{student.email}</p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-3 w-full md:w-auto mt-2 md:mt-0 justify-end md:justify-start">
                  <div className="w-32 flex-shrink-0">
                    <Select
                      value={currentStatus}
                      onValueChange={(val) =>
                        handleStatusChange(student.applicant_id, Number(val))
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
                          {statusList.map((status) => (
                            <SelectItem
                                key={status.id}
                                value={String(status.id)}
                              >
                                {status.name}
                              </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-shrink-0">
                    <StudentInfoModal applicant_id={student.applicant_id.toString()} selectedJobId={job_id!} />
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
