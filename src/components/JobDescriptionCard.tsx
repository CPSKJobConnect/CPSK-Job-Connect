"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlinePeopleAlt } from "react-icons/md";
import { LiaMoneyCheckAltSolid } from "react-icons/lia";
import { RiDeleteBinFill } from "react-icons/ri";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import { JobInfo, JobPostFormData } from "@/types/job";
import { useState, useRef, useEffect } from "react";
import EditJobCard from "./EditJobCard";
import { validateForm } from "@/lib/validateJobForm";
import { toast } from "sonner";

interface JobDescriptionProps {
  job: JobInfo;
  size: "sm" | "md";
  onApply: boolean;
  onEdit: boolean;
  tags?: string[];
  onUpdate?: () => void;
  categories?: string[];
  types?: string[];
  arrangements?: string[];
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  freelance: "bg-yellow-200 text-gray-800",
};

const JobDescriptionCard = ({
  job,
  size,
  onApply,
  onEdit,
  tags,
  onUpdate,
  categories = [],
  types = [],
  arrangements = [],
}: JobDescriptionProps) => {
  const router = useRouter();
  const isClosed = job.status === "expire";
  const [isEditing, setIsEditing] = useState(false); // ✅ เพิ่ม state ที่ขาด
  const [formData, setFormData] = useState<JobPostFormData>(() => ({
    title: job.title,
    category: job.category,
    location: job.location,
    type: job.type,
    arrangement: job.arrangement,
    salary: { min: job.salary.min, max: job.salary.max },
    posted: job.posted,
    deadline: job.deadline,
    skills: job.skills,
    description: { ...job.description },
  }));

  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white flex flex-col gap-2 transition mb-5";

  const sizeStyle = {
    sm: "w-full sm:w-[400px]",
    md: "w-full h-auto",
  }[size];

  const handleApply = () => {
    router.push(`/student/job-apply/${job.id}`);
  };

  const handleEdit = async () => {
    const validationErrors = validateForm(formData);

    if (validationErrors.length > 0) {
      validationErrors.forEach((err) => toast.error(err, { duration: 4000 }));
      return false;
    }

    const confirmed = window.confirm("Are you sure you want to save these changes?");
    if (!confirmed) return false;

    try {
      const body = {
        location: formData.location,
        arrangement: formData.arrangement,
        type: formData.type,
        min_salary: formData.salary.min,
        max_salary: formData.salary.max,
        aboutRole: formData.description.overview,
        responsibilities: formData.description.responsibility,
        requirements: formData.description.requirement.split("\n"),
        qualifications: formData.description.qualification.split("\n"),
        tags: formData.skills,
        category: formData.category,
      };

      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to update job");
        return false;
      }

      toast.success("Job updated successfully!");
      setIsEditing(false);

      if (onUpdate) onUpdate();
      return true;
    } catch (error) {
      toast.error("Something went wrong while saving the job.");
      return false;
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this job post?");
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Job deleted successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete job.");
      }
    } catch (error) {
      toast.error("Something went wrong while deleting the job.");
    }
  };

  const [overviewOpen, setOverviewOpen] = useState(false);
  const [responsibilityOpen, setResponsibilityOpen] = useState(false);
  const [requirementOpen, setRequirementOpen] = useState(false);
  const [qualificationOpen, setQualificationOpen] = useState(false);

  const Section: React.FC<{
    title: string;
    text: string;
    open: boolean;
    setOpen: (v: boolean) => void;
  }> = ({ title, text, open, setOpen }) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const COLLAPSED_MAX_PX = 112;

    const checkOverflow = () => {
      const el = ref.current;
      if (!el) return setIsOverflowing(false);
      setIsOverflowing(el.scrollHeight > COLLAPSED_MAX_PX + 1);
    };

    useEffect(() => {
      checkOverflow();
      window.addEventListener("resize", checkOverflow);
      return () => window.removeEventListener("resize", checkOverflow);
    }, [text]);

    return (
      <div>
        <p className="font-bold">{title}</p>
        <div
          ref={ref}
          className={`text-sm text-gray-700 mt-2 whitespace-pre-wrap break-words break-all ${
            open ? "max-h-[40vh] overflow-auto" : "max-h-28 overflow-hidden"
          }`}
        >
          {text}
        </div>

        {isOverflowing && (
          <div className="mt-2">
            <button
              className="text-sm text-[#2BA17C] hover:underline"
              onClick={() => setOpen(!open)}
              type="button"
              aria-expanded={open}
            >
              {open ? "Show less" : "More"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
      <div className="relative w-full h-40">
        {job.companyBg ? (
          <Image
            src={job.companyBg}
            alt={job.companyName || "companyBg"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gray-100 rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
            {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
          </div>
        )}

        {onEdit && (
          <>
            <div className="absolute flex right-16 top-2">
              <EditJobCard
                job={job}
                formData={formData}
                setFormData={setFormData}
                handleEdit={handleEdit}
                categories={categories || []}
                jobTypes={types || []}
                arrangements={arrangements || []}
                tags={tags || []}
              />
            </div>

            <Button
              onClick={handleDelete}
              className="absolute flex right-4 top-2 w-10 h-8 bg-gradient-to-b from-[#FF755D] to-[#F3573C]
              shadow-lg hover:bg-[#F9664C] transition"
            >
              <RiDeleteBinFill />
            </Button>
          </>
        )}

        <div className="absolute -bottom-6 left-4 bg-white p-2 rounded-md shadow-md">
          {job.companyLogo ? (
            <Image
              src={job.companyLogo}
              alt={job.companyName || "companyLogo"}
              width={60}
              height={60}
              className="h-auto w-auto"
            />
          ) : (
            <div className="h-[60px] w-[60px] bg-gray-100 rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
              {job.companyName ? job.companyName.charAt(0).toUpperCase() : "C"}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 px-4">
        <p className="font-bold text-lg">{job.title}</p>
        <p className="text-gray-600">{job.companyName}</p>
      </div>

      <div className="flex gap-4 px-4 py-2 text-sm text-gray-600">
        <div className="flex gap-1 items-center">
          <IoLocationOutline />
          <span>{job.location}</span>
        </div>
        <div className="flex gap-1 items-center">
          <HiOutlineOfficeBuilding />
          <span>{job.arrangement}</span>
        </div>
        <div className="flex gap-1 items-center">
          <LiaMoneyCheckAltSolid />
          <span>{job.salary.min}</span>
          <span> - </span>
          <span>{job.salary.max} bath</span>
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

        {job.skills.map((tag, idx) => (
          <span
            key={tag ?? idx}
            className="bg-white text-gray-800 shadow-md px-2 py-1 rounded-md text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        <div className="flex flex-col gap-6 px-5 mt-5">
          <Section title="About Role" text={job.description.overview || ""} open={overviewOpen} setOpen={setOverviewOpen} />
          <Section title="Responsibilities" text={job.description.responsibility || ""} open={responsibilityOpen} setOpen={setResponsibilityOpen} />
          <Section title="Requirements" text={job.description.requirement || ""} open={requirementOpen} setOpen={setRequirementOpen} />
          <Section title="Qualifications" text={job.description.qualification || ""} open={qualificationOpen} setOpen={setQualificationOpen} />
        </div>
      </div>

      <div className="px-4 py-4 flex justify-start gap-3 mt-auto">
        {onApply &&
          (isClosed ? (
            <Button disabled className="lg:w-40 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              Expired
            </Button>
          ) : (
            <Button onClick={handleApply} className="lg:w-40 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              Quick Apply
            </Button>
          ))}
      </div>
    </div>
  );
};

export default JobDescriptionCard;
