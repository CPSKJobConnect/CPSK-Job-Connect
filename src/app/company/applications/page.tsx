"use client";
import { IoMdAdd } from "react-icons/io";
import AllJobPost from "./AllJobPost";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { FaRegFileAlt } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { JobWithApplications } from "@/types/job";
import ApplicationList from "./ApplicationList";

export default function Page() {
  const router = useRouter();
  const { data: session } = useSession();

  // State for API data - using JobWithApplications directly (no transformation needed!)
  const [jobs, setJobs] = useState<JobWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for selected job
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Fetch data from API
  useEffect(() => {
    const fetchApplications = async () => {
      // Wait for session to be loaded
      if (!session?.user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Call our API
        const response = await fetch('/api/company/applications');

        // Check if response is OK
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse JSON
        const result = await response.json();

        // Check if API returned success
        if (result.success) {
          setJobs(result.data);  // Use API data directly - no transformation!
          console.log('✅ Fetched jobs:', result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch applications');
        }
      } catch (err) {
        console.error('❌ Error fetching applications:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [session?.user?.email]);

  // Get selected job and its applications
  const selectedJob = selectedCardId !== null
    ? jobs.find(job => job.id === selectedCardId)
    : null;

  const handlePostJob = () => {
    router.push(`/company/job-posting`);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-5 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FD873E]"></div>
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-5 flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center">
            <FaRegFileAlt className="text-2xl text-red-500" />
          </div>
          <p className="text-red-500 font-semibold">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#FD873E] text-white rounded-md hover:bg-[#ff985a]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 mb-3 max-h-screen overflow-y-auto">
      <div className="flex flex-col gap-5">
        <div className="flex flex-row justify-between">
          <div className="flex flex-col">
            <p className="px-4 text-xl font-bold text-gray-700">Jobs & Application</p>
            <p className="px-4 text-md text-gray-500">
              Manage your job postings and candidate applications
            </p>
          </div>
          <div className="flex justify-end p-2">
            <div
              className="flex flex-row bg-[#FD873E] rounded-md shadow-md gap-1 p-2 cursor-pointer hover:bg-[#ff985a] transition-colors"
              onClick={handlePostJob}
            >
              <IoMdAdd className="text-white w-5 h-5 mt-1"/>
              <p className="text-white font-semibold text-md">
                Post New Job
              </p>
            </div>
          </div>
        </div>

        <div className="flex md:flex-row sm:flex-col gap-8">
          <div className="basis-1/5">
            <AllJobPost
              info={jobs}
              onSelectCard={(id) => setSelectedCardId(id)}
            />
          </div>

          <div className="basis-4/5">
            <div className="flex flex-col rounded-md shadow-md p-3 max-h-[120vh]">
              {selectedJob ? (
                <JobDescriptionCard
                  size="md"
                  onApply={false}
                  onEdit={true}
                  job={selectedJob}
                  tags={selectedJob.skills}
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
                      Tip: You can quickly manage your job post here!
                    </p>
                  </div>
                </div>
              )}

              {selectedJob && (
                <ApplicationList
                  job_id={selectedJob.id}
                  applicants={selectedJob.applications}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
