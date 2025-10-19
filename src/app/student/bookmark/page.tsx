"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "@/components/JobCard";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import JobSortDropdown from "./JobSortDropdown";
import { BookmarkJobInfo } from "@/types/job";
import { fakeJobData } from "@public/data/fakeJobDescription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IoMdSearch } from "react-icons/io";


export const mockBookmarkJobs: BookmarkJobInfo[] = fakeJobData.map((job, index) => ({
  job,
  added_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  isBookmarked: index % 2 === 0,
  isApplied: Number(job.id) <= 4,
}));

export default function Page() {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [sortedBookmarkedJobs, setSortedBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<BookmarkJobInfo[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setBookmarkedJobs(mockBookmarkJobs);
    if (!sortedBookmarkedJobs.length) {
      setSortedBookmarkedJobs(bookmarkedJobs);
    }
  }, [bookmarkedJobs, sortedBookmarkedJobs]);

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
