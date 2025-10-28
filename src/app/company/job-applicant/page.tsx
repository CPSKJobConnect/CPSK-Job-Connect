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

export default function Page() {
  const router = useRouter();
  const [jobPost, setJobPost] = useState<JobInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ ดึงข้อมูล job โดยใช้ session-based API
  useEffect(() => {
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
    fetchJobs();
  }, []);

  // ✅ Log เพื่อตรวจสอบข้อมูลที่โหลดได้
  useEffect(() => {
    console.log("Fetched jobs:", jobPost);
  }, [jobPost]);

  // ✅ ดึงรายชื่อ applicant เมื่อเลือก job
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

  const selectedJob =
    selectedCardId !== null ? jobPost.find((job) => Number(job.id) === selectedCardId) : null;

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
        {/* Header Section */}
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

        {/* Main Content */}
        <div className="flex md:flex-row sm:flex-col gap-8">
          {/* Job List */}
          <div className="basis-1/5">
            <AllJobPost info={jobPost} onSelectCard={(id) => setSelectedCardId(id)} />
          </div>

          {/* Job Detail */}
          <div className="basis-4/5">
            <div className="flex flex-col rounded-md shadow-md p-3 max-h-[120vh]">
              {selectedJob ? (
                <>
                  <JobDescriptionCard
                    size="md"
                    onApply={false}
                    onEdit={true}
                    job={selectedJob}
                    tags={selectedJob.skills}
                  />
                  <ApplicationList
                    job_id={Number(selectedJob.id)}
                    applicants={applicants}
                  />
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
      </div>
    </div>
  );
}