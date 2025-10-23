"use client";

import JobCard from "@/components/JobCard";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookmarkJobInfo } from "@/types/job";
import { useEffect, useState } from "react";
import { IoMdSearch } from "react-icons/io";
import JobSortDropdown from "./JobSortDropdown";

export default function Page() {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [sortedBookmarkedJobs, setSortedBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<BookmarkJobInfo[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [error, setError] = useState<string | null>(null);

  // Fetch saved jobs from API on component mount
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/students/saved-jobs", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch bookmarked jobs");
        }
        const data = await response.json();
        setBookmarkedJobs(data.savedJobs || []);
        setSortedBookmarkedJobs(data.savedJobs || []);
      } catch (err) {
        console.error("Error fetching bookmarked jobs:", err);
        setError(err instanceof Error ? err.message : "Failed to load bookmarks");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSavedJobs();
  }, []); 

  useEffect(() => {
    setAppliedJobs(sortedBookmarkedJobs.filter((j) => j.isApplied));
  }, [sortedBookmarkedJobs]);

  const filteredBookmarks = sortedBookmarkedJobs.filter((b) => {
    if (!query) return true;
    return (
      b.job.title.toLowerCase().includes(query.toLowerCase()) ||
      b.job.companyName.toLowerCase().includes(query.toLowerCase())
    );
  });

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2BA17C] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your bookmarks...</p>
        </div>
      </div>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#2BA17C] text-white rounded-md hover:bg-[#27946F] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bookmarks</h1>
          <p className="text-sm text-gray-600">Manage your saved job opportunities</p>
        </div>
      </div>
    
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-6 border border-gray-100 rounded-lg px-7 py-4 mb-6 w-full shadow-md relative">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#34BFA3] rounded-l-md" />
          <div className="pl-4 w-full">
            <div className="flex items-center gap-4 w-full">
              <div className="relative flex-1">
                <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs or companies"
                  className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full h-10"
                />
              </div>
              <div className="flex-shrink-0">
                <JobSortDropdown
                  job={bookmarkedJobs}
                  setSortedBookmarkedJobs={setSortedBookmarkedJobs}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Tabs defaultValue="bookmark">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="rounded-full px-2 py-1 bg-gray-100">
            <TabsTrigger value="bookmark" className="rounded-full px-4 py-2">
              All Bookmarks <span className="ml-2 text-sm text-gray-600">({sortedBookmarkedJobs.length})</span>
            </TabsTrigger>
            <TabsTrigger value="applied" className="rounded-full px-4 py-2">
              Applied <span className="ml-2 text-sm text-gray-600">({appliedJobs.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="bookmark">
          {filteredBookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-600 text-center">No bookmarked jobs found.</p>
              <p className="text-sm text-gray-400 mt-2">Try removing filters or adding bookmarks.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {filteredBookmarks.map((item: BookmarkJobInfo) => (
                <Dialog key={item.job.id}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer">
                      <JobCard size="lg" info={item.job} />
                    </div>
                  </DialogTrigger>

                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{item.job.title}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto">
                      <JobDescriptionCard
                        size="md"
                        onApply={true}
                        onEdit={false}
                        job={item.job}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applied">
          {appliedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-gray-600 text-center">No applied jobs yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                You can apply from job details to keep track here.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {appliedJobs.map((item: BookmarkJobInfo) => (
                <JobCard key={item.job.id} size="lg" info={item.job} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
