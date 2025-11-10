"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { begin, done } from "@/lib/loaderSignal";
import { useParams, useRouter } from "next/navigation"
import { JobInfo } from "@/types/job";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineTimer, MdOutlinePeopleAlt } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FileMeta } from "@/types/file";
import DocumentUploadSection from "../DocumentUploadSection";
import StudentInfoCard from "../StudentInfoCard";
import { Button } from "@/components/ui/button";
import { Student } from "@/types/user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/lib/toastTemplate";


const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  "part-time": "bg-blue-200 text-gray-800",
  internship: "bg-green-100 text-gray-800",
  freelance: "bg-yellow-200 text-gray-800",
};

export default function Page() {
    const params = useParams();
    const router = useRouter();
    const [job, setJob] = useState<JobInfo>();
    const [student, setStudent] = useState<Student>();
    const [existingResume, setResumeExisting] = useState<FileMeta[] | []>([]);
    const [existingCv, setCvExisting] = useState<FileMeta[] | []>([]);
    const [existingPortfolio, setPortfolioExisting] = useState<FileMeta[] | []>([]);
    const [existingTranscript, setTranscriptExisting] = useState<FileMeta[] | []>([]);

    const [uploadedResume, setUploadedResume] = useState<File | null>(null);
    const [selectedResume, setSelectedResume] = useState<FileMeta | null>(null);
    const [uploadedCv, setUploadedCv] = useState<File | null>(null);
    const [selectedCv, setSelectedCv] = useState<FileMeta | null>(null);
    const [uploadedPortfolio, setUploadedPortfolio] = useState<File | null>(null);
    const [selectedPortfolio, setSelectedPortfolio] = useState<FileMeta | null>(null);
    const [uploadedTranscript, setUploadedTranscript] = useState<File | null>(null);
    const [selectedTranscript, setSelectedTranscript] = useState<FileMeta | null>(null);
    const [alreadyApplied, setAlreadyApplied] = useState(false);

    useEffect(() => {
        if (!params?.id) return;

    const fetchJob = async () => {
      try {
        begin();
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
      } finally {
        done();
      }
    };

    const fetchStudent = async () => {
      try {
        begin();
        const res = await fetch(`/api/students/[id]`);
        if (!res.ok) {
          console.error("Failed to fetch student");
          return;
        }
        const data: Student = await res.json();
        setStudent(data);
        // API returns grouped documents; fall back to empty arrays when absent
        setResumeExisting(data.documents?.resume || []);
        setCvExisting(data.documents?.cv || []);
        setPortfolioExisting(data.documents?.portfolio || []);
        setTranscriptExisting(data.documents?.transcript || []);

      } catch (error) {
        console.error("Failed to fetch student:", error);
      } finally {
        done();
      }
    };

    fetchJob();
    fetchStudent();
    },  [params.id, router]);

    useEffect(() => {
    if (!student || !job) return;

    const checkApplication = async () => {
      try {
        const res = await fetch("/api/jobs/check-application", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: student.id, jobId: job.id }),
        });
        const data = await res.json();
        setAlreadyApplied(data.applied);
      } catch (err) {
        console.error("Failed to check application:", err);
      }
    };

    checkApplication();
  }, [student, job]);

    const handleSubmit = async () => {
    // Check required documents according to job.requiredDocuments if provided.
    const required = job && (job as any).requiredDocuments && (job as any).requiredDocuments.length
      ? (job as any).requiredDocuments
      : ["resume", "portfolio"];

    const hasDoc = (key: string) => {
      switch (key) {
        case "resume":
          return !!(uploadedResume || selectedResume);
        case "cv":
          return !!(uploadedCv || selectedCv); // fallback to resume
        case "portfolio":
          return !!(uploadedPortfolio || selectedPortfolio);
        case "transcript":
          return !!(uploadedTranscript || selectedTranscript);
        default:
          return true;
      }
    };

    for (const req of required) {
      if (!hasDoc(req)) {
        const label = req.charAt(0).toUpperCase() + req.slice(1);
        toast.error(`${label} Missing`, `Please select or upload your ${label} before submitting.`);
        return;
      }
    }

    if (!student || !job) {
      toast.error("Data Missing", "Student or Job data is missing.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", String(student.account_id));
    formData.append("jobId", String(job.id));

    if (uploadedResume) {
      formData.append("resume", uploadedResume);
    } else if (selectedResume) {
      formData.append("resumeId", String(selectedResume.id));
    }

    if (uploadedCv) {
      formData.append("cv", uploadedCv);
    } else if (selectedCv) {
      formData.append("cvId", String(selectedCv.id));
    }

    if (uploadedPortfolio) {
      formData.append("portfolio", uploadedPortfolio);
    } else if (selectedPortfolio) {
      formData.append("portfolioId", String(selectedPortfolio.id));
    }

    if (uploadedTranscript) {
      formData.append("transcript", uploadedTranscript);
    } else if (selectedTranscript) {
      formData.append("transcriptId", String(selectedTranscript.id));
    }

    try {
      const res = await fetch("/api/jobs/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        toast.error("Failed to submit application.", "Please try again later.");
        return;
      }

      toast.success("Application submitted!", "Your job application has been sent successfully.");
      // Save a recently applied marker to localStorage so the application list can highlight it
      try {
        const marker = {
          jobId: job.id,
          appliedAt: Date.now(),
        };
        localStorage.setItem("recentlyApplied", JSON.stringify(marker));
      } catch (err) {
        // ignore localStorage errors
        console.warn("Could not write recentlyApplied marker", err);
      }

      router.push("/student/my-application");
    } catch (err) {
      toast.error("An error occurred while submitting your application.", "Please try again later.");
    }
  };

  if (!job || !student) {
    return <div>Loading...</div>;
  }

    return (
      <>
        <div className="flex flex-col md:flex-row items-start md:items-center">
          <div className="py-6 md:py-14 md:ml-10 flex justify-center md:justify-start w-full md:w-auto">
            {job.companyLogo ? (
              <Image
                src={job.companyLogo}
                alt={job.companyName || "companyLogo"}
                width={120}
                height={120}
                className="h-auto bg-white translate-y-1 shadow-md rounded-md"
              />
             ) : (
              <div className="h-[120px] w-[120px] bg-gray-100 translate-y-1 shadow-md rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
                {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
            </div>
            )}
          </div>
          <div className="flex flex-col p-5 mb-3 w-full md:flex-1">
            <p className="px-4 text-md text-gray-700">Apply For</p>
            <div className="mt-1 px-4">
              <p className="font-bold text-lg">{job.title}</p>
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

            <div className="flex flex-wrap gap-2 px-4 mt-2 p-2 overflow-x-auto">
            <span
              className={`px-2 py-1 rounded-md text-sm shadow-md ${
                typeColors[job.type] || "bg-white text-gray-800"
              }`}
            >
              {job.type}
            </span>
            {job?.skills?.map((tag, idx) => (
              <span
                key={tag ?? idx}
                className="bg-white text-gray-800 shadow-md px-2 py-1 rounded-md text-sm whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-5 px-4 md:px-10 items-stretch">
          <div className="w-full md:basis-1/4">
            <StudentInfoCard
              firstname={student.firstname}
              lastname={student.lastname}
              email={student.email}
              phone={student.phone}
              faculty={student.faculty}
            />
          </div>
          <div className="w-full md:basis-3/4 flex flex-col gap-5 p-3 rounded-md shadow-md border border-gray-100">
            <div className="flex flex-row gap-2">
                <IoDocumentTextOutline  className="w-7 h-7" />
                <p className="text-lg font-semibold text-gray-800">Documents</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-2 md:px-6 py-3">
              <DocumentUploadSection
                title="Resume"
                description="Upload your most recent resume or select from previously uploaded files"
                uploadedFile={uploadedResume}
                setUploadedFile={setUploadedResume}
                selectedFile={selectedResume}
                setSelectedFile={setSelectedResume}
                existingFiles={existingResume}
                acceptedTypes={["pdf", "doc", "docx"]}
              />

              <DocumentUploadSection
                title="CV"
                description="Upload your CV or select from previously uploaded files"
                uploadedFile={uploadedCv}
                setUploadedFile={setUploadedCv}
                selectedFile={selectedCv}
                setSelectedFile={setSelectedCv}
                existingFiles={existingCv}
                acceptedTypes={["pdf", "doc", "docx"]}
              />

              <DocumentUploadSection
                title="Portfolio"
                description="Upload your portfolio or select from previously uploaded files"
                uploadedFile={uploadedPortfolio}
                setUploadedFile={setUploadedPortfolio}
                selectedFile={selectedPortfolio}
                setSelectedFile={setSelectedPortfolio}
                existingFiles={existingPortfolio}
                acceptedTypes={["pdf", "doc", "docx"]}
              />

              <DocumentUploadSection
                title="Transcript"
                description="Upload your academic transcript (PDF preferred)"
                uploadedFile={uploadedTranscript}
                setUploadedFile={setUploadedTranscript}
                selectedFile={selectedTranscript}
                setSelectedFile={setSelectedTranscript}
                existingFiles={existingTranscript}
                acceptedTypes={["pdf", "doc", "docx"]}
              />
            </div>
          </div>
        </div>
        <div className="px-4 md:px-10 py-5 flex justify-center md:justify-start">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="bg-[#34BFA3] hover:bg-[#2DA68C] font-semibold rounded-md shadow-md text-white font-md px-8 py-3 w-full md:w-auto" disabled={alreadyApplied}>
                {alreadyApplied ? "Already Applied" : "Submit"}
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Your Application</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to submit your application. Please preview the form and verify that all information is accurate before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <div className="max-h-[60vh] overflow-y-auto px-4 py-2">
                <section className="mb-4 shadow-md border border-gray-100 rounded-md p-4">
                  <h3 className="text-sm font-semibold text-gray-700">Job</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    <p className="font-medium">{job.title} — {job.companyName}</p>
                    <p className="text-xs">{job.location} • {job.type} • {job.arrangement}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.skills?.map((s, i) => (
                        <span key={s ?? i} className="text-xs bg-white px-2 py-1 rounded-md shadow-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="shadow-md border border-gray-100 rounded-md p-4">
                  <section className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Student Info</h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium">{student.firstname} {student.lastname}</p>
                      <p className="text-xs">Email: {student.email}</p>
                      <p className="text-xs">Phone: {student.phone}</p>
                      <p className="text-xs">Faculty: {student.faculty}</p>
                    </div>
                  </section>

                  <section className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Documents</h3>
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div>
                        <p className="text-xs font-medium">Resume</p>
                        <p className="text-xs">{uploadedResume ? uploadedResume.name : selectedResume ? selectedResume.name || `File #${selectedResume.id}` : "(none)"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium">Portfolio</p>
                        <p className="text-xs">{uploadedPortfolio ? uploadedPortfolio.name : selectedPortfolio ? selectedPortfolio.name || `File #${selectedPortfolio.id}` : "(none)"}</p>
                      </div>
                    </div>
                  </section>
                </section>
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button onClick={handleSubmit} className="bg-[#34BFA3] hover:bg-[#2DA68C] font-semibold rounded-md shadow-md text-white px-6 py-2">
                    Apply
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </>
    );
  }
  