"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";


interface JobInfo {
  id: string;
  title: string;
  type: string;
  arrangement: string;
  location: string;
  applied: number;
  companyLogo: string;
  companyName: string;
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
  const [search, setSearch] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await fetch(`/api/company/${companyId}/jobs`);
      if (!res.ok) {
        console.warn("Failed to fetch job posts:", res.statusText);
        setJobs([]);
        return;
      }
      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job?")) return;
    const res = await fetch(`/api/company/jobs/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Job deleted");
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } else toast.error("Failed to delete job");
  };

  useEffect(() => {
    fetchJobs();
  }, [companyId]);

  if (loading) return <p>Loading job posts...</p>;

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  if (!filteredJobs.length) return <p>No job posts yet.</p>;

  return (
    <div>
      <Input
        placeholder="Search jobs..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4"
      />
      <div className="grid gap-4">
        {filteredJobs.map((job) => (
          <JobCard key={job.id} job={job} onDelete={deleteJob} fetchJobs={fetchJobs} />
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, onDelete, fetchJobs }: { job: JobInfo; onDelete: (id: string) => void; fetchJobs: () => void }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState(job);

  const handleChange = (field: keyof JobInfo, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDescriptionChange = (field: keyof JobInfo["description"], value: string) => {
    setForm((prev) => ({ ...prev, description: { ...prev.description, [field]: value } }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/company/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Failed to update job");
        return;
      }
      toast.success("Job updated successfully");
      setEditOpen(false);
      fetchJobs();
    } catch (err) {
      console.error(err);
      toast.error("Error updating job");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white">
        <div className="flex items-center gap-4">
          {job.companyLogo && (
            <Image
              src={job.companyLogo}
              alt={job.companyName}
              width={48}
              height={48}
              className="rounded-full border"
            />
          )}
          <div>
            <h3 className="font-semibold text-lg">{job.title}</h3>
            <div className="flex gap-2 mt-1">
              <Badge>{job.type}</Badge>
              <Badge variant="secondary">{job.arrangement}</Badge>
              <Badge variant="outline">{job.location}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{job.applied} applied</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewOpen(true)}>View</Button>
          <Button variant="default" size="sm" onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(job.id)}>Delete</Button>
        </div>
      </div>

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{job.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>Overview:</strong> {job.description.overview}</p>
            <p><strong>Responsibilities:</strong> {job.description.responsibility}</p>
            <p><strong>Requirements:</strong> {job.description.requirement}</p>
            <p><strong>Qualifications:</strong> {job.description.qualification}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit {job.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Job title"
            />
            <Input
              value={form.type}
              onChange={(e) => handleChange("type", e.target.value)}
              placeholder="Job type"
            />
            <Input
              value={form.arrangement}
              onChange={(e) => handleChange("arrangement", e.target.value)}
              placeholder="Work arrangement"
            />
            <Input
              value={form.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="Location"
            />
            <Input
              value={form.description.overview}
              onChange={(e) => handleDescriptionChange("overview", e.target.value)}
              placeholder="Overview"
            />
            <Input
              value={form.description.responsibility}
              onChange={(e) => handleDescriptionChange("responsibility", e.target.value)}
              placeholder="Responsibilities"
            />
            <Input
              value={form.description.requirement}
              onChange={(e) => handleDescriptionChange("requirement", e.target.value)}
              placeholder="Requirements"
            />
            <Input
              value={form.description.qualification}
              onChange={(e) => handleDescriptionChange("qualification", e.target.value)}
              placeholder="Qualifications"
            />
          </div>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
