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
import StudentInfoModal from "./StudentInfoModal";

interface Applicant {
  applicant_id: number;
  name: string;
  student_id: string;
  status: number; // id ของ status
  applied_at: string;
  resume: string | null;
  portfolio: string | null;
  logoUrl: string | null;
}

interface Status {
  id: number;
  name: string;
}

interface ApplicationListProps {
  job_id: number | null;
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

const ApplicationList = ({ job_id, applicants }: ApplicationListProps) => {
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
    <div className="flex flex-col gap-4 p-4 bg-gray-50">
      {applicants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <p className="text-center text-sm">No applicants yet</p>
        </div>
      ) : (
        applicants.map((a) => {
          const currentStatus = statusMap[a.applicant_id] || { id: a.status, type: "pending" };
          return (
            <div
              key={a.applicant_id}
              className="flex flex-col md:flex-row justify-between items-center border p-4 rounded-md shadow-md bg-white"
            >
              <div className="flex gap-4 items-center w-full md:w-auto">
                <Image
                  src={a.logoUrl ?? "/assets/images/companyLogo.png"}
                  alt="profile"
                  width={60}
                  height={60}
                  className="rounded-full shadow-md"
                />
                <div className="flex flex-col">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-gray-500 text-sm">
                    {a.applied_at &&
                      new Date(a.applied_at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-center mt-4 md:mt-0">
                <Select
                  value={currentStatus.id.toString()}
                  onValueChange={(val) => handleStatusChange(a.applicant_id, Number(val))}
                >
                  <SelectTrigger
                    className={`rounded-full w-40 text-sm p-2 border-none ${statusColors[currentStatus.type]}`}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      {statusList.map((s) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name.charAt(0).toUpperCase() + s.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <StudentInfoModal applicant_id={a.applicant_id.toString()} selectedJobId={job_id!} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ApplicationList;
