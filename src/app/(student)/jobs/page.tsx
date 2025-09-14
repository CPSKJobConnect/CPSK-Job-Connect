"use client";
import { useState, useEffect } from "react";
import JobCard from "@/components/JobCard";
import JobFilterBar from "@/components/JobFilterBar";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { filterJobs } from "@/lib/jobFilter";
import { JobInfo } from "@/types/job";
import { JobFilterInfo } from "@/types/filter";
import { fakeJobData } from "public/data/fakeJobDescription";
import { fakeFilterInfo } from "public/data/fakeFilterInfo";
import { FaRegFileAlt } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";
import { IoMdSearch } from "react-icons/io";

export default function Page() {
  const [jobData, setJobData] = useState<JobInfo[]>([]);
  const [filteredJob, setFilteredJob] = useState<JobInfo[]>([]);
  const [filterInfo, setFilterInfo] = useState<JobFilterInfo | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [jobToShow, setJobToShow] = useState<JobInfo[]>([]);
  const [filterApplied, setFilterAppiled] = useState(false);

  useEffect(() => {
    // fetch job data
    setFilterInfo(fakeFilterInfo);
    setJobData(fakeJobData);
  }, []);

  useEffect(() => {
    console.log(selectedCardId);
  }, [selectedCardId]);

  useEffect(() => {
    if (filteredJob.length > 0 || (filteredJob.length === 0 && filterApplied)) {
      setJobToShow(filteredJob);
    } else {
      setJobToShow(jobData);
    }
  }, [filteredJob, jobData]);

  const handleSearch = (filters: any) => {
    setFilterAppiled(true);
    const result = filterJobs(jobData, filters);
    setFilteredJob(result);
  };

  return (
    <div className="flex flex-col gap-6 px-10">
      <div className="sticky top-0 z-10 mb-1">
        <JobFilterBar filter={filterInfo} onSearch={handleSearch} />
      </div>
      {jobToShow.length > 0 ? (
        <div className="flex flex-col md:flex-col lg:flex-row sm:flex-col gap-8 h-screen">
          <div className="overflow-y-auto">
            {jobToShow.map((job, idx) => (
              <div key={idx} onClick={() => setSelectedCardId(idx)}>
                <JobCard size="md" info={job} />
              </div>
            ))}
          </div>

          <div className="flex flex-1 justify-center">
            {selectedCardId !== null ? (
              <JobDescriptionCard
                size="md"
                onApply={true}
                onEdit={false}
                job={jobToShow.find((job, idx) => idx === selectedCardId)!}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-44">
                <div className="bg-[#ABE9D6] rounded-full w-[60px] h-[60px] flex items-center justify-center">
                  <FaRegFileAlt className="text-xl text-[#2BA17C]" />
                </div>
                <p className="font-bold">
                  Details of the job post will be shown here
                </p>
                <div className="bg-[#F3FEFA] flex flex-row gap-2 rounded-xl p-3">
                  <MdTipsAndUpdates className="text-[#2BA17C]" />
                  <p className="text-sm">
                    Tip: You quickly apply for the job here!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-44">
          <div className="bg-[#ABE9D6] rounded-full w-[60px] h-[60px] flex items-center justify-center">
            <IoMdSearch className="text-xl text-[#2BA17C]" />
          </div>
          <p className="font-bold">
            Not Found Jobs
          </p>
        </div>
      )}
    </div>
  );
}