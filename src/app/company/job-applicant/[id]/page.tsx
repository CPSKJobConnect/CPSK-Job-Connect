"use client";
import { IoMdAdd } from "react-icons/io";
import AllJobPost from "../AllJobPost";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { FaRegFileAlt } from "react-icons/fa";
import { MdTipsAndUpdates } from "react-icons/md";
import React from "react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { mockJobInCompany } from "public/data/mockJobInCompany";
import { JobInfo } from "@/types/job";
import ApplicationList from "../ApplicationList";
import { fakeJobData } from "public/data/fakeJobDescription";
import { mockApplicantList } from "public/data/mockApplicantList";
import { useRouter } from "next/navigation";


export default function Page() {
  const params = useParams();
  const router = useRouter();
  const [jobPost, setJobPost] = useState<JobInfo[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  useEffect(() => {
    if (!params?.id) return;

    const jobLinks = mockJobInCompany.filter(
      (j) => j.company_id === params.id
    );

    const jobs = jobLinks
      .map((link) => fakeJobData.find((job) => job.id === link.post_id))
      .filter((j): j is JobInfo => j !== undefined);

    setJobPost(jobs);

  }, [params?.id]);

  const selectedJob = selectedCardId !== null ? jobPost[selectedCardId] : null;


  const applicants =
    selectedJob != null
      ? mockApplicantList.find((a) => a.job_id === selectedJob.id)
      : null;


  const handlePostJob = () => {
    router.push(`/company/job-posting`);
  }

    return (
      <div className="p-5 mb-3 max-h-screen overflow-y-auto">
        <div className="flex flex-col gap-5">
          <div className="flex flex-row justify-between">
            <div className="flex flex-col">
              <p className="px-4 text-xl font-bold text-gray-700">Jobs & Application</p>
              <p className="px-4 text-md text-gray-500">Manage your job postings and candidate applications</p>
            </div>
            <div className="flex justify-end p-2">
              <div className="flex flex-row bg-[#FD873E] rounded-md shadow-md gap-1 p-2">
                <IoMdAdd className="text-white w-5 h-5 mt-1"/>
                <p className="text-white font-semibold text-md" onClick={handlePostJob}>Post New Job</p>
              </div>
            </div>
          </div>
          <div className="flex md:flex-row sm:flex-col gap-8">
            <div className="basis-1/5">
              <AllJobPost info={jobPost} onSelectCard={(id) => setSelectedCardId(id)} />
            </div>
            <div className="basis-4/5">
              <div className="flex flex-col rounded-md shadow-md p-3 max-h-[120vh]">
                <div>
                  {selectedCardId !== null ? (
                    <JobDescriptionCard
                      size="md"
                      onApply={false}
                      onEdit={true}
                      job={jobPost.find((job) => job.id === selectedCardId.toString())!}                 
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
                </div>
                {selectedCardId &&
                  <ApplicationList job_id={selectedCardId} applicants={applicants?.applicants || []} />
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };