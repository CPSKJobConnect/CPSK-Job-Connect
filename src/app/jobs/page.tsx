"use client";
import JobFilterBar from "@/app/jobs/JobFilterBar";
import { JobFilters as FilterFormData } from "@/app/jobs/JobFilterBar";
import { JobFilters } from "@/lib/jobFilter";
import JobCard from "@/components/JobCard";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { filterJobs } from "@/lib/jobFilter";
import { JobFilterInfo } from "@/types/filter";
import { JobInfo } from "@/types/job";
import { useEffect, useState } from "react";
import { FaRegFileAlt } from "react-icons/fa";
import { IoMdSearch } from "react-icons/io";
import { MdTipsAndUpdates } from "react-icons/md";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Page() {
  const [jobData, setJobData] = useState<JobInfo[]>([]);
  const [filteredJob, setFilteredJob] = useState<JobInfo[]>([]);
  const [filterInfo, setFilterInfo] = useState<JobFilterInfo | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobToShow, setJobToShow] = useState<JobInfo[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);

  useEffect(() => {
  const fetchJobsAndFilters = async () => {
      try {
        const resJobs = await fetch("/api/jobs");
        const dataJobs = await resJobs.json();
        setJobData(dataJobs);

        const resFilters = await fetch("/api/jobs/filter");
        const dataFilters = await resFilters.json();
        setFilterInfo(dataFilters);
      } catch (err) {
        console.error("Error fetching jobs or filters:", err);
      }
    };

    fetchJobsAndFilters();
    if (typeof window !== "undefined") {
      const m = window.matchMedia("(max-width: 1024px)");
      const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsSmallScreen((e as any).matches);
      setIsSmallScreen(m.matches);
      if (typeof m.addEventListener === "function") {
        m.addEventListener("change", handler as any);
      } else if (typeof (m as any).addListener === "function") {
        (m as any).addListener(handler as any);
      }
      return () => {
        if (typeof m.removeEventListener === "function") {
          m.removeEventListener("change", handler as any);
        } else if (typeof (m as any).removeListener === "function") {
          (m as any).removeListener(handler as any);
        }
      };
    }
  }, []);

  useEffect(() => {
    if (filteredJob.length > 0 || (filteredJob.length === 0 && filterApplied)) {
      setJobToShow(filteredJob);
    } else {
      setJobToShow(jobData);
    }
  }, [filteredJob, jobData, filterApplied]);

  useEffect(() => {
    if (!isSmallScreen && dialogOpen) {
      setDialogOpen(false);
    }

    if (isSmallScreen && selectedCardId !== null) {
      setDialogOpen(true);
    }
  }, [isSmallScreen, selectedCardId]);

  const handleSearch = (filters: FilterFormData) => {
    setFilterApplied(true);

    const jobFilters: JobFilters = {
      keyword: filters.keyword || undefined,
      jobCategory: filters.jobCategory || undefined,
      location: filters.location || undefined,
      jobType: filters.jobType || undefined,
      jobArrangement: filters.jobArrangement || undefined,
      minSalary: filters.minSalary ? Number(filters.minSalary) : undefined,
      maxSalary: filters.maxSalary ? Number(filters.maxSalary) : undefined,
      datePost: filters.datePost || undefined,
    };

    const result = filterJobs(jobData, jobFilters);
    setFilteredJob(result);
  };

  return (
    <div className="flex flex-col gap-6 px-10">
      <div className="sticky top-0 z-10">
        <JobFilterBar filter={filterInfo} onSearch={handleSearch} />
      </div>
      {jobToShow.length > 0 ? (
        <div className="flex flex-col md:flex-col lg:flex-row sm:flex-col gap-8 h-screen">
          <div className="overflow-y-auto">
            {jobToShow.map((job, idx) => (
              <div key={idx} onClick={() => {
                setSelectedCardId(idx);
                if (isSmallScreen) setDialogOpen(true);
              }}>
                <JobCard size="md" info={job} />
              </div>
            ))}
          </div>

          <div className="hidden lg:flex flex-1 justify-center">
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

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedCardId(null);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedCardId !== null ? jobToShow[selectedCardId].title : ""}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto">
                {selectedCardId !== null && (
                  <JobDescriptionCard
                    size="md"
                    onApply={true}
                    onEdit={false}
                    job={jobToShow[selectedCardId]}
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
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