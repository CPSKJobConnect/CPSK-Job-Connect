import React from "react";
import { TopJobsCardProps } from "@/types/companyStat";


const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    closed: "bg-red-100 text-red-800",
};

export default function TopJobCard({ jobs, loading }: TopJobsCardProps) {
    const items = Array.isArray(jobs) ? jobs : [];

    return (
    <div className="flex flex-col rounded-md shadow-lg w-full gap-4 p-4 overflow-y-auto h-[500px]">
        <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-gray-700">Top 5 Job Posts</p>
            <p className="text-sm text-gray-400">Jobs with the highest number of applications</p>
        </div>
      {items.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <p className="text-center text-sm">No job posts yet</p>
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        {items.map((job) => (
          <div key={job.id} className="flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
            <div className="flex flex-row gap-2">
              <p className="font-medium text-gray-800">{job.title}</p>
              <span className={`flex justify-center items-center text-xs font-semibold px-2 py-1 rounded-full w-[80px] ${statusColor[job.status]}`}>
                {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-semibold text-gray-900">{job.applications}</p>
              <span className="text-xs text-gray-500">Applications</span>
            </div>
          </div>
        ))}
      </div>

    )}
    </div>
  );
}
