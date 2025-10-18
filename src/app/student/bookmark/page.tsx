"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobCard from "@/components/JobCard";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { BiSortAlt2 } from "react-icons/bi";
import { BookmarkJobInfo } from "@/types/job";
import { fakeJobData } from "@public/data/fakeJobDescription";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IoMdSearch } from "react-icons/io";

export const mockBookmarkJobs: BookmarkJobInfo[] = fakeJobData.map((job, index) => ({
  job,
  isBookmarked: index % 2 === 0,
  isApplied: Number(job.id) <= 4,
}));

export default function Page() {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<BookmarkJobInfo[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setBookmarkedJobs(mockBookmarkJobs);
  }, []);

  useEffect(() => {
    setAppliedJobs(bookmarkedJobs.filter((j) => j.isApplied));
  }, [bookmarkedJobs]);

  const filteredBookmarks = bookmarkedJobs.filter((b) => {
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

      <div className="flex flex-row items-center gap-6 border border-gray-100 rounded-lg px-7 py-3 mb-6 w-full shadow-md">
        <div className="relative basis-4/5">
          <IoMdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs or companies"
              className="pl-10 pr-3 py-2 bg-white rounded-md border-gray-100 shadow-sm w-full"
            />
        </div>
        <div className="basis-1/5">
          <Button className="bg-[#34BFA3] hover:bg-[#2DA68C] md:w-[150px] text-white font-semibold rounded-full px-4 flex items-center gap-2">
            <BiSortAlt2 size={20} />
            <span className="hidden sm:inline">Sort</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="bookmark">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="rounded-full px-2 py-1 bg-gray-100">
            <TabsTrigger value="bookmark" className="rounded-full px-4 py-2">
              All Bookmarks <span className="ml-2 text-sm text-gray-600">({bookmarkedJobs.length})</span>
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
