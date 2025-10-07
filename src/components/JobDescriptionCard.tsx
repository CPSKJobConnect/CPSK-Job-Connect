"use client";

import { JobInfo } from "@/types/job";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FiEdit } from "react-icons/fi";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlinePeopleAlt, MdOutlineTimer } from "react-icons/md";
import { RiDeleteBinFill } from "react-icons/ri";
import { Button } from "./ui/button";


interface JobDescriptionProps {
  job: JobInfo;
  size: "sm" | "md";
  onApply: boolean;
  onEdit: boolean;
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-green-100 text-gray-800",
  contract: "bg-yellow-200 text-gray-800",
  hybrid: "bg-purple-200 text-gray-800"
};



const JobDescriptionCard = ({job, size, onApply, onEdit}: JobDescriptionProps) => {
  const router = useRouter();
  const baseStyle =
    "rounded-xl shadow-md border border-gray-100 bg-white flex flex-col gap-2 transition mb-5";

  const sizeStyle = {
    sm: "w-full sm:w-[400px]",
    md: "w-full h-auto",
  }[size];

  const handleApply = () => {
    router.push(`student/job-apply/${job.id}`);
  };

  const handleSave = () => {
    
  };

  const handleEdit = () => {
    
  };

  const handleDelete = () => {
    
  };

  return (
    <div className={`${baseStyle} ${sizeStyle}`}>
      <div className="relative w-full h-40">
        <Image
          src={job.companyBg}
          alt="company background"
          fill
          className="object-cover"
        />
        {onEdit && (
          <>
            <Button onClick={handleEdit}
              className="absolute flex right-16 top-2 lg:w-20 h-8 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              <div className="flex gap-2">
                <FiEdit />
                <p>Edit</p>
              </div>
            </Button>
            <Button onClick={handleDelete}
              className="absolute flex right-4 top-2 w-10 h-8 bg-gradient-to-b from-[#FF755D] to-[#F3573C] 
              shadow-lg hover:bg-[#F9664C] transition">
              <RiDeleteBinFill />
            </Button>
          </>
        )}
        <div className="absolute -bottom-6 left-4 bg-white p-2 rounded-md shadow-md">
          <Image
            src={job.companyLogo}
            alt="companyLogo"
            width={60}
            height={60}
            className="h-auto w-auto"
          />
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
        {job.skills.map((tag, idx) => (
          <span
            key={idx}
            className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="font-bold">About Role</p>
          <p>{job.description.overview}</p>
        </div>

        <div>
          <p className="font-bold">Responsibilities</p>
          <p>{job.description.responsibility}</p>
        </div>

        <div>
          <p className="font-bold">Requirements</p>
          <p>{job.description.requirement}</p>
        </div>

        <div>
          <p className="font-bold">Qualifications</p>
          <p>{job.description.qualification}</p>
        </div>
      </div>
      </div>

      <div className="px-4 py-4 flex justify-start gap-3 mt-auto">
        {onApply && (
          <>
            <Button onClick={handleApply}
              className="lg:w-40 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              Quick Apply
            </Button>
            <Button onClick={handleSave}
            className="h-10 bg-[#67C3A6] shadow-lg hover:bg-[#27946F] transition">
            Save
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default JobDescriptionCard;
