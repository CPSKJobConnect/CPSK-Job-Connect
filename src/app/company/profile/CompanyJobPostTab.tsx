"use client";

import { useEffect, useState } from "react";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { toast } from "sonner";

interface JobInfo {
  id: string;
  title: string;
  category: string;
  location: string;
  type: string;
  arrangement: string;
  salary: { min: number; max: number };
  posted: string;
  deadline: string;
  status: string;
  skills: string[];
  applied: number;

  companyName: string;
  companyLogo: string;
  companyBg: string;

  description: {
    overview: string;
    responsibility: string;
    requirement: string;
    qualification: string;
  };
}

interface CompanyJobPostsProps {
  companyId: string;
}

export default function CompanyJobPosts({ companyId }: CompanyJobPostsProps) {
  const [jobs, setJobs] = useState<JobInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/company/jobs/${companyId}`);
      if (!res.ok) {
        toast.error("Failed to fetch job posts");
        return;
      }
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Error loading jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) return <p>Loading job posts...</p>;
  if (!jobs.length) return <p>No job posts yet.</p>;

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <JobDescriptionCard key={job.id} job={job} size="md" onApply={false} onEdit={true} />
      ))}
    </div>
  );
}
