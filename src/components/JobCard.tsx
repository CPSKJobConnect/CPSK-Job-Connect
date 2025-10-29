"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPostedDate } from "@/lib/dateHelper";
import { JobInfo } from "@/types/job";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { MdOutlineLink, MdOutlinePeopleAlt, MdOutlineReportProblem, MdOutlineShare, MdOutlineTimer } from "react-icons/md";
import { Button } from "./ui/button";

interface JobCardProps {
  info: JobInfo;
  size?: "sm" | "md" | "lg";
  onUnbookmark?: (jobId: string) => void;
  isCompanyView: boolean
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  parttime: "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  contract: "bg-yellow-200 text-gray-800",
  hybrid: "bg-purple-200 text-gray-800"
};


const JobCard = (job: JobCardProps) => {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(job.info.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const isClosed = job.info.status === "expire";

  // Check if job is bookmarked when component mounts
  // This ensures the star icon reflects the current saved status
  useEffect(() => {
    const checkIfSaved = async () => {
      // Only check if user is logged in
      if (!session?.user?.id) {
        setIsSaved(false);
        return;
      }

      // If isSaved prop is already provided, use it
      // This avoids unnecessary API calls when data comes from server
      if (job.info.isSaved !== undefined) {
        setIsSaved(job.info.isSaved);
        return;
      }

      // Fetch the saved status from API
      setIsCheckingStatus(true);
      try {
        const response = await fetch(
          `/api/students/saved-jobs?jobId=${job.info.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved);
        }
      } catch (error) {
        console.error("Error checking saved status:", error);
        // On error, assume not saved
        setIsSaved(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkIfSaved();
  }, [session?.user?.id, job.info.id, job.info.isSaved]);
  const baseStyle =
    `rounded-xl shadow-md border border-gray-100 ${isClosed ? "bg-gray-200/70 cursor-not-allowed" : "bg-white hover:bg-[#F3FEFA]"} p-4 flex flex-col gap-2 transition mb-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg`;

    const sizeStyle = {
      sm: "w-full sm:w-[400px] min-h-[140px]",
      md: "w-full sm:w-[400px] min-h-[250px] md:w-[550px]",
      lg: "w-full md:w-full min-h-[250px]",
    }[job.size || "md"];

  const handleSaveToggle = async () => {
    // Check if user is logged in
    // Session is managed by NextAuth - if no session, user needs to login
    if (!session?.user?.id) {
      alert("Please login to save jobs");
      return;
    }

    setIsLoading(true);
    try {
      // Use DELETE to unsave, POST to save
      const method = isSaved ? "DELETE" : "POST";

      // NEW ENDPOINT: /api/students/saved-jobs (secure, middleware-protected)
      // OLD ENDPOINT was: /api/jobs/saved (insecure, public)
      const response = await fetch("/api/students/saved-jobs", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // SECURITY IMPROVEMENT: We only send jobId now
          // The userId is extracted from the session on the server
          // This prevents users from impersonating others
          jobId: job.info.id,
        }),
      });

      if (response.ok) {
        // Toggle the local state for immediate UI feedback
        setIsSaved(!isSaved);
        // If this was an unbookmark (DELETE) and parent provided a callback, notify parent to remove the card
        if (method === "DELETE" && typeof (job as any).onUnbookmark === "function") {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          (job as any).onUnbookmark(job.info.id);
        }
      } else {
        const error = await response.json();
        console.error("Failed to toggle save:", error);
        alert("Failed to save job. Please try again.");
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`${baseStyle} ${sizeStyle}`}
      onClick={(e) => {
        if (isClosed) e.stopPropagation();
      }}
      aria-disabled={isClosed}
    >
      <div className="flex justify-between items-start">
        <div className="flex gap-2">
          {job.info.companyLogo ? (
            <Image
              src={job.info.companyLogo}
              alt={job.info.companyName || "companyLogo"}
              width={60}
              height={60}
              className="h-auto bg-white translate-y-1 shadow-md rounded-md"
            />
          ) : (
            <div className="w-15 h-15 bg-gray-100 translate-y-1 shadow-md rounded-md flex items-center justify-center text-sm font-medium text-gray-700">
              {job.info.companyName ? job.info.companyName.charAt(0).toUpperCase() : "C"}
            </div>
          )}
          <div className="p-2">
            <p className="font-bold text-md">{job.info.title}</p>
            <p className="text-gray-600">{job.info.companyName}</p>
          </div>
        </div>

        {!job.isCompanyView && (
          <div className="flex gap-3 p-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveToggle();
              }}
              disabled={isLoading || isCheckingStatus}
              className="transition-colors disabled:opacity-50"
              aria-label={isSaved ? "Unsave job" : "Save job"}
              type="button"
            >
              {isCheckingStatus ? (
                // Show outline star while checking status
                <FaRegStar className="w-5 h-5 text-gray-400 animate-pulse" />
              ) : isSaved ? (
                // Show filled yellow star if saved
                <FaStar className="w-5 h-5 text-yellow-500 hover:text-yellow-600" />
              ) : (
                // Show outline star if not saved
                <FaRegStar className="w-5 h-5 hover:text-yellow-500" />
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Share job"
                  type="button"
                  className="p-0"
                >
                  <MdOutlineShare className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuItem>
                    <MdOutlineLink/>
                    <p>Copy Link</p>
                  </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MdOutlineReportProblem className="text-red-600"/>
                  <p className="text-red-600">Report Post</p>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>        
        )}

      </div>

      <div className="flex gap-4 py-2">
        <div className="flex gap-1 min-w-0 items-center">
          <div className="py-1"><IoLocationOutline /></div>
          <span className="truncate text-sm text-gray-700 max-w-[250px]" title={job.info.location}>{job.info.location}</span>
        </div>
        <div className="flex gap-1 min-w-0 items-center">
          <div className="py-1"><MdOutlineTimer /></div>
          <span className="text-sm text-gray-700">{formatPostedDate(job.info.posted)}</span>
        </div>
        <div className="flex gap-1 min-w-0 items-center">
          <div className="py-1"><MdOutlinePeopleAlt /></div>
          <span className="text-sm text-gray-700">{job.info.applied} applied</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <span
          className={`px-2 py-1 rounded-md text-sm shadow-md ${
            isClosed ? "bg-gray-100 text-gray-800"
            : typeColors[job.info.type] || "bg-white text-gray-800"
          }`}
        >
          {job.info.type}
        </span>

        {job.info.skills?.map((tag, idx) => (
          <span key={idx} className={`${isClosed ? "bg-gray-100" : "bg-white"} text-grey-800 shadow-md px-2 py-1 rounded-md text-sm`}>
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-auto mb-2 flex justify-end">
        {job.size === "md" && (
          <Button className="lg:w-40 md:w-30 sm:w-30 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
            View Detail
          </Button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
