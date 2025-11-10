"use client";
import { IoMdAdd } from "react-icons/io";
import AllJobPost from "./AllJobPost";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { FaRegFileAlt } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { JobInfo } from "@/types/job";
import ApplicationList from "./ApplicationList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Page() {
  const router = useRouter();
  const [jobPost, setJobPost] = useState<JobInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [allDepartment, setAllDepartment] = useState<string[]>([]);
  const [jobTypeList, setJobTypeList] = useState<string[]>([]);
  const [arrangementList, setArrangementList] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isCompanyVerified, setIsCompanyVerified] = useState(true);

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/company/jobs");
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data: JobInfo[] = await res.json();
      setJobPost(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchFilters = async () => {
        try {
            const res = await fetch("/api/jobs/filter");
            if (!res.ok) throw new Error("Failed to fetch filters");
            const data = await res.json();
            setAllDepartment(data.categories || []);
            setJobTypeList(data.types || []);
            setArrangementList(data.arrangements || []);
            setAllTags(data.tags || []);
        } catch (error) {
            console.error("Error fetching job filters:", error);
        }
    };

    fetchFilters();
    }, []);

  useEffect(() => {
    fetchJobs();

    // Fetch company verification status
    const fetchCompanyStatus = async () => {
      try {
        const res = await fetch("/api/company/profile");
        if (res.ok) {
          const data = await res.json();
          setIsCompanyVerified(data.registration_status === "APPROVED");
        }
      } catch (error) {
        console.error("Error fetching company status:", error);
      }
    };
    fetchCompanyStatus();

    // Responsive dialog
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
  }, []);

  // Fetch applicants when selectedCardId changes
  useEffect(() => {
    if (!selectedCardId) {
      setApplicants([]);
      return;
    }

    const fetchApplicants = async () => {
      try {
        const res = await fetch(`/api/jobs/${selectedCardId}/applicants`);
        if (!res.ok) throw new Error("Failed to fetch applicants");
        const data = await res.json();
        setApplicants(data.applicants || []);
      } catch (error) {
        console.error("Error fetching applicants:", error);
      }
    };

    fetchApplicants();
  }, [selectedCardId]);

  // Handle small screen dialog
  useEffect(() => {
    if (!isSmallScreen && dialogOpen) setDialogOpen(false);
    if (isSmallScreen && selectedCardId !== null) setDialogOpen(true);
  }, [isSmallScreen, selectedCardId]);

  const selectedJob = selectedCardId !== null ? jobPost.find(job => Number(job.id) === selectedCardId) : null;

  const handlePostJob = () => {
    router.push(`/company/job-posting`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="p-5 mb-3 max-h-screen overflow-y-auto">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <p className="px-4 text-xl font-bold text-gray-700">Jobs & Applications</p>
            <p className="px-4 text-md text-gray-500">
              Manage your job postings and candidate applications
            </p>
          </div>
          <div className="flex justify-end p-2">
            <button
              onClick={handlePostJob}
              className="flex flex-row bg-[#FD873E] rounded-md shadow-md gap-1 p-2 hover:bg-[#e46d25] transition"
            >
              <IoMdAdd className="text-white w-5 h-5 mt-1" />
              <p className="text-white font-semibold text-md">Post New Job</p>
            </button>
          </div>
        </div>

        {/* Main */}
        <div className="flex md:flex-row sm:flex-col gap-8">
          <div className="basis-1/5">
            <AllJobPost info={jobPost} onSelectCard={id => setSelectedCardId(id)} allDepartment={allDepartment} />
          </div>

          <div className="flex-1">
            <div className="flex flex-col rounded-md shadow-md p-3 max-h-[120vh]">
              {selectedJob ? (
                <>
                  <JobDescriptionCard
                      size="md"
                      onApply={false}
                      onEdit={true}
                      job={selectedJob}
                      categories={allDepartment}
                      types={jobTypeList}
                      arrangements={arrangementList}
                      tags={allTags}
                  />
                  <ApplicationList applicants={applicants} isCompanyVerified={isCompanyVerified} />
                </>
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
                      Tip: You can quickly manage your job post here!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dialog for small screens */}
        <Dialog open={dialogOpen} onOpenChange={open => {
          setDialogOpen(open);
          if (!open) setSelectedCardId(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedJob?.title || ""}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-y-auto">
              {selectedJob && (
                <div className="space-y-4">
                  <JobDescriptionCard size="md" onApply={false} onEdit={true} job={selectedJob} />
                  <ApplicationList applicants={applicants} isCompanyVerified={isCompanyVerified} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
