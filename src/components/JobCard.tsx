"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatPostedDate } from "@/lib/dateHelper";
import { isValidImageUrl } from "@/lib/validateImageUrl";
import { JobInfo } from "@/types/job";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Star, MapPin, Link as LinkIcon, Users, AlertTriangle, Clock, MoreVertical } from "lucide-react";
import { Button } from "./ui/button";
import { ReportJobDialog } from "./ReportJobDialog";
import { toast } from "sonner";

interface JobCardProps {
  info: JobInfo;
  size?: "sm" | "md" | "lg";
  onUnbookmark?: (jobId: string) => void;
  isCompanyView: boolean;
}

const typeColors: Record<string, string> = {
  fulltime: "bg-pink-200 text-gray-800",
  "part-time": "bg-blue-200 text-gray-800",
  internship: "bg-orange-100 text-gray-800",
  freelance: "bg-yellow-200 text-gray-800",
};

const logDebug = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(...args)
  }
}

const JobCard = (job: JobCardProps) => {
  const { data: session } = useSession();
  const [isSaved, setIsSaved] = useState(job.info.isSaved || false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isClosed = job.info.status === "expire";

  useEffect(() => {
    const checkIfSaved = async () => {
      if (job.isCompanyView || !session?.user?.id) {
        setIsSaved(false);
        return;
      }

      if (job.info.isSaved !== undefined) {
        setIsSaved(job.info.isSaved);
        return;
      }

      setIsCheckingStatus(true);
      try {
        const response = await fetch(`/api/students/saved-jobs?jobId=${job.info.id}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (response.ok) {
          const data = await response.json();
          setIsSaved(data.isSaved);
        }
      } catch (error) {
        logDebug("Error checking saved status:", error);
        setIsSaved(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkIfSaved();
  }, [session?.user?.id, job.info.id, job.info.isSaved, job.isCompanyView]);

  const baseStyle = `rounded-xl shadow-md border border-gray-100 ${
    isClosed ? "bg-gray-200/70" : "bg-white hover:bg-[#F3FEFA]"
  } p-4 flex flex-col gap-2 transition mb-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg`;

  const sizeStyle = {
    sm: "w-full sm:w-[400px] min-h-[140px]",
    md: "w-full sm:w-[400px] min-h-[250px] md:w-[550px]",
    lg: "w-full md:w-full min-h-[250px]",
  }[job.size || "md"];

  const handleSaveToggle = async () => {
    if (!session?.user?.id) {
      toast.error("Please login to save jobs");
      return;
    }

    setIsLoading(true);
    try {
      const method = isSaved ? "DELETE" : "POST";
      const response = await fetch("/api/students/saved-jobs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.info.id }),
      });

      if (response.ok) {
        setIsSaved(!isSaved);
        if (method === "DELETE") {
          toast.success("Job removed from bookmarks");
          if (typeof job.onUnbookmark === "function") {
            job.onUnbookmark(job.info.id);
          }
        } else {
          toast.success("Job saved to bookmarks!");
        }
      } else {
        const error = await response.json();
        logDebug("Failed to toggle save:", error);
        toast.error("Failed to save job. Please try again.");
      }
    } catch (error) {
      logDebug("Error toggling save:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    const jobUrl = `${window.location.origin}/jobs/${job.info.id}`;
    navigator.clipboard.writeText(jobUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
    <>
      <div data-testid={`job-card-${job.info.id}`} className={`${baseStyle} ${sizeStyle}`}>
        {/* Top section: image + title + company */}
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {isValidImageUrl(job.info.companyLogo) ? (
              <Image
                src={job.info.companyLogo}
                alt={job.info.companyName || "companyLogo"}
                width={60}
                height={60}
                className="w-[60px] h-[60px] object-cover bg-white translate-y-1 shadow-md rounded-md"
              />
            ) : (
              <div className="w-[60px] h-[60px] bg-gray-100 translate-y-1 shadow-md rounded-md flex items-center justify-center text-lg font-medium text-gray-700">
                {job.info.companyName ? job.info.companyName.charAt(0).toUpperCase() : "C"}
              </div>
            )}
            <div className="p-2">
              <p className="font-bold text-md">{job.info.title}</p>
              <p className="text-gray-600">{job.info.companyName}</p>
            </div>
          </div>

          {!job.isCompanyView && (
            <div className="p-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                    onClick={(e) => e.stopPropagation()}
                    aria-label="More options"
                    type="button"
                    className="hover:bg-gray-100 rounded-full p-1 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleSaveToggle(); }}
                    disabled={isLoading || isCheckingStatus}
                  >
                    {isCheckingStatus ? (
                      <Star className="mr-2 h-4 w-4 text-gray-400 animate-pulse" />
                    ) : isSaved ? (
                      <Star className="mr-2 h-4 w-4 text-yellow-500" />
                    ) : (
                      <Star className="mr-2 h-4 w-4" />
                    )}
                    <span>{isSaved ? "Unsave Job" : "Save Job"}</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <span>Report Post</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="flex gap-4 py-2">
          <div className="flex gap-1 min-w-0 items-center">
            <div className="py-1"><MapPin className="w-4 h-4 text-gray-500" /></div>
            <span className="truncate text-sm text-gray-700 max-w-[120px]" title={job.info.location}>{job.info.location}</span>
          </div>
          <div className="flex gap-1 min-w-0 items-center">
            <div className="py-1"><Clock className="w-4 h-4 text-gray-500" /></div>
            <span className="text-sm text-gray-700">{formatPostedDate(job.info.posted)}</span>
          </div>
          <div className="flex gap-1 min-w-0 items-center">
            <div className="py-1"><Users className="w-4 h-4 text-gray-500" /></div>
            <span className="text-sm text-gray-700">{job.info.applied} applied</span>
          </div>
        </div>

        {/* Job type & skills */}
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

        {/* View Detail button */}
        <div className="mt-auto mb-2 flex justify-end">
          {job.size === "md" && (
            <Button className="lg:w-40 md:w-30 sm:w-30 h-10 bg-[#2BA17C] shadow-lg hover:bg-[#27946F] transition">
              View Detail
            </Button>
          )}
        </div>
      </div>

      {/* Report dialog outside the card div */}
      <ReportJobDialog
        targetId={job.info.id}
        targetType="POST"
        open={reportOpen}
        onOpenChange={setReportOpen} />
    </>
  );
};

export default JobCard;
