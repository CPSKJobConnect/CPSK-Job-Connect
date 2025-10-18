"use client";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import JobCard from "@/components/JobCard";
import { BiSortAlt2 } from "react-icons/bi";
import { JobInfo, BookmarkJobInfo } from "@/types/job";
import { fakeJobData } from "@public/data/fakeJobDescription";


export const mockBookmarkJobs: BookmarkJobInfo[] = fakeJobData.map((job, index) => ({
  job,
  isBookmarked: index % 2 === 0,
  isApplied: Number(job.id) <= 4,
}));


export default function Page() {
  const [bookmarkedJobs, setBookmarkedJobs] = useState<BookmarkJobInfo[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<BookmarkJobInfo[]>([]);

  useEffect(() => {
    const fetchBookmarkedJobs = async () => {
      setBookmarkedJobs(mockBookmarkJobs);
    };

    const fetchAppliedJobs = async () => {
      const applied = bookmarkedJobs.filter(job => job.isApplied);
      setAppliedJobs(applied);
    };

    fetchBookmarkedJobs();
    fetchAppliedJobs();
  }, []);

  return (
    <div className="flex flex-col p-6 gap-6">
        <div className="flex flex-col gap-1">
            <p className="text-xl font-bold text-gray-800">Bookmark</p>
            <p className="text-md text-gray-600">Manage your saved job opportunities</p>
        </div>


      <Tabs defaultValue="detail">
        <div className="flex justify-between">
            <TabsList className="rounded-full px-2 justify-start">
                <TabsTrigger value="bookmark" className="rounded-full">All Bookmarks</TabsTrigger>
                <TabsTrigger value="applied" className="rounded-full">Applied</TabsTrigger>
            </TabsList>
            <div className="justify-end">
                <Button className="bg-[#34BFA3] hover:bg-[#2DA68C] text-white font-semibold rounded-full px-4 flex items-center gap-2">
                    <BiSortAlt2 size={30} />
                </Button>
            </div>
        </div>
        <TabsContent value="bookmark">
            {bookmarkedJobs.length === 0 ? (
                <p className="text-gray-600 text-center mt-10">No bookmarked jobs yet.</p>
            ) : (
                <div className="flex flex-col gap-4">
                    {bookmarkedJobs.map((item: BookmarkJobInfo) => (
                        <JobCard key={item.job.id} size="lg" info={item.job} />
                    ))}
                </div>
            )}
        </TabsContent>
        <TabsContent value="applied">
            {appliedJobs.length === 0 ? (
                <p className="text-gray-600 text-center mt-10">No applied jobs yet.</p>
            ) : (
                <div className="flex flex-col gap-4">
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
