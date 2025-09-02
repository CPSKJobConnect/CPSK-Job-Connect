"use client";
import { useState, useEffect } from "react";
import JobCard from "@/components/JobCard";
import JobFilterBar from "@/components/JobFilterBar";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { JobInfo } from "@/types/job";
import { JobFilterInfo } from "@/types/filter";
import { FaRegFileAlt } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";


export default function Page() {
  const [jobData, setJobData] = useState<JobInfo[]>([]);
  const [filterInfo, setFilterInfo] = useState<JobFilterInfo | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    console.log(selectedCardId);
  }, [selectedCardId]);

  useEffect(() => {
    // fetch job data
  })

  return (
    <div className="flex flex-col gap-6 px-10">
      <div className="sticky top-0 z-10">
        <JobFilterBar filter={filterInfo}/>
      </div>

      <div className="flex flex-col md:flex-col lg:flex-row sm:flex-col gap-8 h-screen">
        <div className="overflow-y-auto">
          {jobData.map((job, idx) => (
            <div key={idx} onClick={() => setSelectedCardId(idx)}>
              <JobCard size="md" {...job}/>
            </div>
          ))}
        </div>

        <div className="flex flex-1 justify-center">
          {selectedCardId ? (
            <JobDescriptionCard size="md" onApply={true} onEdit={false} job={jobData.find((job, idx) => idx === selectedCardId)!}/>): (
            <div className="flex flex-col items-center gap-4 py-44">
              <div className="bg-[#ABE9D6] rounded-full w-[60px] h-[60px] flex items-center justify-center">
                <FaRegFileAlt className="text-xl text-[#2BA17C]" />
              </div>
              <p className="font-bold">
                Details of the job post will be shown here
              </p>
              <div className="bg-[#F3FEFA] flex flex-row gap-2 rounded-xl p-3">
                <MdTipsAndUpdates className="text-[#2BA17C]"/>
                <p className="text-sm">
                  Tip: You quickly apply for the job here!
                </p>
              </div>
            </div>)}
        </div>
      </div>
  </div>
  );
}