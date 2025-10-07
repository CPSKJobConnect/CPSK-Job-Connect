"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"
import { JobInfo } from "@/types/job";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer, MdOutlinePeopleAlt } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FileMeta } from "@/types/file";
import DocumentUploadSection from "./DocumentUploadSection";
import StudentInfoCard from "./StudentInfoCard";
import { Button } from "@/components/ui/button";
import { Student } from "@/types/user";


const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-green-100 text-gray-800",
  contract: "bg-yellow-200 text-gray-800",
  hybrid: "bg-purple-200 text-gray-800"
};

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobInfo>();
    const [student, setStudent] = useState<Student>();
    const [existingResume, setResumeExisting] = useState<FileMeta[] | []>([]);
    const [existingPortfolio, setPortfolioExisting] = useState<FileMeta[] | []>([]);
    const [uploadedResume, setUploadedResume] = useState<File | null>(null);
    const [selectedResume, setSelectedResume] = useState<FileMeta | null>(null);
    const [uploadedPortfolio, setUploadedPortfolio] = useState<File | null>(null);
    const [selectedPortfolio, setSelectedPortfolio] = useState<FileMeta | null>(null);

    useEffect(() => {
        if (!params?.id) return;

        const fetchJob = async () => {
            try {
                const res = await fetch(`/api/jobs/${params.id}`);
                if (!res.ok) {
                    router.push("/jobs");
                    return;
                }
                const data: JobInfo = await res.json();
                setJob(data);
            }   catch (error) {
                console.error("Failed to fetch job:", error);
                router.push("/jobs");
            }
        };

        const fetchStudent = async () => {
            try {
                const res = await fetch(`/api/students/[id]`);
                if (!res.ok) {
                    console.error("Failed to fetch student");
                    return;
                }
                const data: Student = await res.json();
                setStudent(data);
                setResumeExisting(data.documents.resume)
                setPortfolioExisting(data.documents.portfolio)
            } catch (error) {
                console.error("Failed to fetch student:", error);
            }
        };

        fetchJob();
        fetchStudent();
    },  [params.id, router]);
    
    const handleSubmit = async () => {
    if (!uploadedResume && !selectedResume) {
      alert("Please select or upload your Resume before submitting.");
      return;
    }
    if (!uploadedPortfolio && !selectedPortfolio) {
      alert("Please select or upload your Portfolio before submitting.");
      return;
    }

    if (!student || !job) {
      alert("Student or Job data is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", String(student.id));
    formData.append("jobId", String(job.id));

    if (uploadedResume) {
      formData.append("resume", uploadedResume);
    } else if (selectedResume) {
      formData.append("resumeId", String(selectedResume.id));
    }

    if (uploadedPortfolio) {
      formData.append("portfolio", uploadedPortfolio);
    } else if (selectedPortfolio) {
      formData.append("portfolioId", String(selectedPortfolio.id));
    }

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert("Failed to submit application.");
        return;
      }

      alert("Application submitted successfully!");
      console.log("Application response:", data);
    } catch (err) {
      console.error(err);
      alert("Error submitting application.");
    }
  };

  if (!job || !student) {
    return <div>Loading...</div>;
  }

    return (
      <>
        <div className="flex flex-row">
          <div className="py-14 ml-10">
            <Image
              src={job.companyLogo}
              alt="companyLogo"
              width={120}
              height={120}
              className="h-auto w-auto border border-gray-100"
            />
          </div>
          <div className="flex flex-col p-5 mb-3">
            <p className="px-4 text-md text-gray-700">Apply For</p>
            <div className="mt-1 px-4">
              <p className="font-bold text-lg">{job.jobName}</p>
              <p className="text-gray-600">{job.companyName}</p>
            </div>

            <div className="flex gap-4 px-4 py-2 text-sm text-gray-600">
              <div className="flex gap-1 items-center">
                <IoLocationOutline />
                <span>{job.location}</span>
              </div>
              <div className="flex gap-1 items-center">
                <MdOutlineTimer />
                <span>{job.posted}</span>
              </div>
              <div className="flex gap-1 items-center">
                <MdOutlinePeopleAlt />
                <span>{job.applied} applied</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 px-4 mt-2">
            <span
              className={`px-2 py-1 rounded-md text-sm shadow-md ${
                typeColors[job.type] || "bg-white text-gray-800"
              }`}
            >
              {job.type}
            </span>
            {job?.tags.map((tag, idx) => (
              <span
                key={idx}
                className="bg-white text-gray-800 shadow-md px-2 py-1 rounded-md text-sm"
              >
                {tag}
              </span>
            ))}
            </div>
          </div>
        </div>
        <div className="flex flex-row gap-5 px-10 items-stretch">
          <div className="basis-1/4">
            <StudentInfoCard
              firstname={student.firstname}
              lastname={student.lastname}
              email={student.email}
              phone={student.phone}
              faculty={student.faculty}
            />
          </div>

          <div className="basis-3/4 flex flex-col gap-5 p-3 rounded-md shadow-md border border-gray-100 w-full max-w-[75%] h-full">
            <div className="flex flex-row gap-2">
                <IoDocumentTextOutline  className="w-7 h-7" />
                <p className="text-lg font-semibold text-gray-800">Documents</p>
            </div>
            <div className="flex md:flex-row sm:flex-col px-10 py-3 gap-10">
              <div className="flex-1 min-w-0">
                <DocumentUploadSection
                  title="Resume"
                  description="Upload your most recent resume or select from previously uploaded files"
                  uploadedFile={uploadedResume}
                  setUploadedFile={setUploadedResume}
                  selectedFile={selectedResume}
                  setSelectedFile={setSelectedResume}
                  existingFiles={existingResume}
                />
              </div>

              <div className="flex-1 min-w-0">
                <DocumentUploadSection
                  title="Portfolio"
                  description="Upload your portfolio or select from previously uploaded files"
                  uploadedFile={uploadedPortfolio}
                  setUploadedFile={setUploadedPortfolio}
                  selectedFile={selectedPortfolio}
                  setSelectedFile={setSelectedPortfolio}
                  existingFiles={existingPortfolio}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="px-10 py-5">
        <Button className="bg-[#34BFA3] hover:bg-[#2DA68C] font-semibold rounded-md shadow-md text-white font-md px-10" onClick={handleSubmit}>
          Submit
        </Button>
        </div>
      </>
    );
  }
  