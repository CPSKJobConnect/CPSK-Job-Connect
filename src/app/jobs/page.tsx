"use client";
import JobFilterBar from "@/app/jobs/JobFilterBar";
import { JobFilters as FilterFormData } from "@/app/jobs/JobFilterBar";
import JobCard from "@/components/JobCard";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { JobFilterInfo } from "@/types/filter";
import { JobInfo } from "@/types/job";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, FileText, Search, Lightbulb } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Page() {
  const { data: session } = useSession();
  const [jobData, setJobData] = useState<JobInfo[]>([]);
  const [filteredJob, setFilteredJob] = useState<JobInfo[]>([]);
  const [filterInfo, setFilterInfo] = useState<JobFilterInfo | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobToShow, setJobToShow] = useState<JobInfo[]>([]);
  const [filterApplied, setFilterApplied] = useState(false);
  const selectedJob = selectedCardId !== null ? jobToShow[selectedCardId] : null;
  const [role, setRole] = useState<string | null>(null);
  const [isCompanyView, setIsCompanyView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(6);
  const [loadingPage, setLoadingPage] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilters, setActiveFilters] = useState<FilterFormData | null>(null);
  const fetchPage = async (page: number, filters?: FilterFormData) => {
    setLoadingPage(true);
    try {
      const { begin, done } = await import("@/lib/loaderSignal").then(m => m).catch(() => ({ begin: () => {}, done: () => {} }));
      begin();
      try {
        const userId = session?.user?.id;
        const offset = page * limit;
        const params = new URLSearchParams();
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (userId) params.set('userId', String(userId));
        if (filters) {
          if (filters.keyword) params.set('keyword', filters.keyword);
          if (filters.jobCategory) params.set('jobCategory', filters.jobCategory);
          if (filters.location) params.set('location', filters.location);
          if (filters.jobType) params.set('jobType', filters.jobType);
          if (filters.jobArrangement) params.set('jobArrangement', filters.jobArrangement);
          if (filters.minSalary) params.set('minSalary', String(filters.minSalary));
          if (filters.maxSalary) params.set('maxSalary', String(filters.maxSalary));
          if (filters.datePost) params.set('datePost', filters.datePost);
        }
        const jobsUrl = `/api/jobs?${params.toString()}`;

        const resJobs = await fetch(jobsUrl);
        const dataJobs = await resJobs.json();

        const now = Date.now();
        const activeJobs = Array.isArray(dataJobs)
          ? dataJobs.filter((j: JobInfo) => {
              if (!j.deadline) return true;
              const d = Date.parse(j.deadline);
              if (isNaN(d)) return true;
              return d >= now;
            })
          : [];

        // set the current page's jobs
        setJobData(activeJobs);
        setCurrentPage(page);
        setHasMore(activeJobs.length === limit);
        setSelectedCardId(null);
      } finally {
        done();
      }
    } catch (err) {
      console.error("Error fetching jobs page:", err);
    } finally {
      setLoadingPage(false);
      setIsLoaded(true);
    }
  };

  useEffect(() => {
  const fetchUserRole = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        setRole(data.user?.role || null);
        setIsCompanyView(data.user?.role === 'company');
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    };
  const fetchJobsAndFilters = async () => {
        try {
          await fetchPage(0, activeFilters ?? undefined);
          const resFilters = await fetch("/api/jobs/filter");
          const dataFilters = await resFilters.json();
          console.log("Fetched filter info:", dataFilters);
          setFilterInfo(dataFilters);
        } catch (err2) {
          console.error("Error fetching jobs or filters (fallback):", err2);
        }
        setIsLoaded(true);
      };

      fetchUserRole();
      fetchJobsAndFilters();

    if (typeof window !== "undefined") {
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
    }
  }, [session?.user?.id]); // Re-fetch when user logs in/out

  useEffect(() => {
    // Server returns paginated (and possibly filtered) results in `jobData`.
    // Always show `jobData` as the source of truth for the current page.
    setJobToShow(jobData);
  }, [filteredJob, jobData, filterApplied]);

  useEffect(() => {
    if (!isSmallScreen && dialogOpen) {
      setDialogOpen(false);
    }

    if (isSmallScreen && selectedCardId !== null) {
      setDialogOpen(true);
    }
  }, [isSmallScreen, selectedCardId]);

  const handleSearch = (filters: FilterFormData) => {
    setFilterApplied(true);
    setActiveFilters(filters);
    // Fetch first page with filters from server
    fetchPage(0, filters as FilterFormData);
  };

  return (
    <div className="flex flex-col gap-6 px-10">
      <div className="sticky top-0 z-10">
        <JobFilterBar filter={filterInfo} onSearch={handleSearch} />
      </div>

      

      {jobToShow.length > 0 ? (
        <div className="flex flex-col md:flex-col lg:flex-row sm:flex-col gap-8 h-screen">
          <div className="overflow-y-auto">
            {jobToShow.map((job, idx) => (
              <div key={idx} onClick={() => {
                setSelectedCardId(idx);
                if (isSmallScreen) setDialogOpen(true);
              }}>
                <JobCard size="md" info={job} isCompanyView={isCompanyView}/>
              </div>
            ))}
            <div className="flex justify-center mt-2 mb-4 w-full">
                <div className="w-full sm:w-[400px] md:w-[550px] bg-white rounded-full shadow px-4 py-2 relative">
                  <div className="flex items-center justify-between w-full">
                    <button
                      className={`p-2 rounded-full ${currentPage === 0 || loadingPage ? 'opacity-50 cursor-not-allowed' : 'bg-transparent'}`}
                      onClick={() => { if (!loadingPage && currentPage > 0) fetchPage(currentPage - 1, activeFilters ?? undefined); }}
                      disabled={currentPage === 0 || loadingPage}
                      aria-label="Previous page"
                    >
                      <ChevronLeft />
                    </button>

                    <button
                      className={`p-2 rounded-full ${!hasMore || loadingPage ? 'opacity-50 cursor-not-allowed' : 'bg-transparent'}`}
                      onClick={() => { if (!loadingPage && hasMore) fetchPage(currentPage + 1, activeFilters ?? undefined); }}
                      disabled={!hasMore || loadingPage}
                      aria-label="Next page"
                    >
                      <ChevronRight />
                    </button>
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-sm pointer-events-none">
                    Page <span className="font-medium">{currentPage + 1}</span>
                  </div>
                </div>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 justify-center">
            {selectedJob ? (
              role === 'company' ? (
                <JobDescriptionCard
                  size="lg"
                  onApply={false}
                  onEdit={false}
                  job={selectedJob}
                />
              ): (
                <JobDescriptionCard
                  size="lg"
                  onApply={true}
                  onEdit={false}
                  job={selectedJob}
                />
              )
            ) : (
              <div className="flex flex-col items-center gap-4 py-44">
                  <div className="bg-[#ABE9D6] rounded-full w-[60px] h-[60px] flex items-center justify-center">
                  <FileText className="text-xl text-[#2BA17C]" />
                </div>
                <p className="font-bold">
                  Details of the job post will be shown here
                </p>
                <div className="bg-[#F3FEFA] flex flex-row gap-2 rounded-xl p-3">
                  <Lightbulb className="text-[#2BA17C]" />
                  <p className="text-sm">
                    Tip: You quickly apply for the job here!
                  </p>
                </div>
              </div>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setSelectedCardId(null);
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{selectedCardId !== null ? jobToShow[selectedCardId].title : ""}</DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-y-auto">
                {selectedJob !== null && (
                  role === 'company' ? (
                    <JobDescriptionCard
                      size="lg"
                      onApply={false}
                      onEdit={false}
                      job={selectedJob}
                    />
                  ): (
                    <JobDescriptionCard
                      size="lg"
                      onApply={true}
                      onEdit={false}
                      job={selectedJob}
                    />
                  )
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        isLoaded ? (
          <div className="flex flex-col items-center gap-4 py-44">
              <div className="bg-[#ABE9D6] rounded-full w-[60px] h-[60px] flex items-center justify-center">
              <Search className="text-xl text-[#2BA17C]" />
            </div>
            <p className="font-bold">
              Not Found Jobs
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}
