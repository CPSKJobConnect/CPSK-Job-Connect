"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import JobDescriptionCard from "@/components/JobDescriptionCard";
import { JobInfo } from "@/types/job";

interface Report {
  id: number;
  account: { username: string; email: string };
  description: string;
  target_type: string;
  target_id: number;
  reportType?: { id: number; name: string; target: string };
  report_type_id?: number;
  is_resolved: boolean;
  created_at: string;
  jobPost?: {
    id: number;
    jobName: string;
    location: string;
    aboutRole: string;
    responsibilities?: string;
    requirements: string[];
    qualifications: string[];
    min_salary: number;
    max_salary: number;
    deadline: string;
    applied: number;
    created_at: string;
    is_Published: boolean;
    company?: {
        id: number;
        name: string;
        address: string;
        account?: { logoUrl?: string; backgroundUrl?: string };
    };
    jobArrangement?: { id: number; name: string };
    jobType?: { id: number; name: string };
    category?: { id: number; name: string };
    tags?: { id: number; name: string }[];
  } | null;
}

interface ReportType {
  id: number;
  name: string;
  target: string;
}

type SortField = "created_at" | "name" | "resolved" | null;
type SortDirection = "asc" | "desc" | null;

export default function ManageReportsPage() {
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [targetTypeOptions, setTargetTypeOptions] = useState<string[]>([]);
  const [allReportTypes, setAllReportTypes] = useState<ReportType[]>([]);
  const [reportTypeOptions, setReportTypeOptions] = useState<ReportType[]>([]);

  const [targetType, setTargetType] = useState("ALL");
  const [reportTypeId, setReportTypeId] = useState("-1");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [resolvedFilter, setResolvedFilter] = useState<null | boolean>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data: Report[]) => {
        setAllReports(data);
        setReports(data);
        const uniqueTargets = Array.from(new Set(data.map((r) => r.target_type)));
        setTargetTypeOptions(["ALL", ...uniqueTargets]);
      });
  }, []);

  useEffect(() => {
    fetch("/api/reports/filter/type")
      .then((res) => res.json())
      .then((data: ReportType[]) => setAllReportTypes(data));
  }, []);

  useEffect(() => {
    if (allReportTypes.length === 0) return;
    let options: ReportType[] = [];
    if (targetType === "ALL") {
      options = [{ id: -1, name: "ALL", target: "" }, ...allReportTypes];
    } else {
      const filtered = allReportTypes.filter((t) => t.target === targetType);
      options = [{ id: -1, name: "ALL", target: targetType }, ...filtered];
    }
    setReportTypeOptions(options);
    setReportTypeId("-1");
    setCurrentPage(1);
  }, [allReportTypes, targetType]);

  const handleSortClick = (field: SortField) => {
    if (field === "resolved") {
      if (resolvedFilter === null) setResolvedFilter(true);
      else if (resolvedFilter === true) setResolvedFilter(false);
      else setResolvedFilter(null);
      setSortField(null);
      setSortDirection(null);
    } else {
      if (sortField !== field) {
        setSortField(field);
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection(null);
      }
      setResolvedFilter(null);
    }
    setCurrentPage(1);
  };

  useEffect(() => {
    let filtered = allReports;
    if (targetType !== "ALL") filtered = filtered.filter(r => r.target_type === targetType);
    if (reportTypeId !== "-1") filtered = filtered.filter(r => r.report_type_id === Number(reportTypeId));
    if (resolvedFilter !== null) filtered = filtered.filter(r => r.is_resolved === resolvedFilter);

    if (sortField && sortDirection) {
      filtered = filtered.slice().sort((a, b) => {
        if (sortField === "created_at") {
          return sortDirection === "asc"
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sortField === "name") {
          const nameA = a.reportType?.name || "";
          const nameB = b.reportType?.name || "";
          return sortDirection === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
        }
        return 0;
      });
    }

    const startIndex = (currentPage - 1) * limit;
    setReports(filtered.slice(startIndex, startIndex + limit));
  }, [allReports, targetType, reportTypeId, currentPage, limit, sortField, sortDirection, resolvedFilter]);

  useEffect(() => setCurrentPage(1), [limit, targetType, reportTypeId]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

  const resolveReport = async (reportId: number) => {
    if (!confirm("Are you sure you want to mark this report as resolved?")) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_resolved: true }),
      });
      if (!res.ok) throw new Error("Failed to update report");

      setReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
      setAllReports(prev => prev.map(r => r.id === reportId ? { ...r, is_resolved: true } : r));
      toast.success("Report marked as resolved!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to resolve report.");
    }
  };

  const totalReportsCount = allReports.filter(r =>
    (targetType === "ALL" || r.target_type === targetType) &&
    (reportTypeId === "-1" || r.report_type_id === Number(reportTypeId)) &&
    (resolvedFilter === null || r.is_resolved === resolvedFilter)
  ).length;
  const totalPages = Math.ceil(totalReportsCount / limit);

  const mapJobInfoForDescription = (r: Report) => {
    if (!r.jobPost) return null;
    return {
      id: r.jobPost.id.toString(),
      title: r.jobPost.jobName,
      companyName: r.jobPost.company?.name || "N/A",
      companyLogo: r.jobPost.company?.account?.logoUrl || "",
      companyBg: r.jobPost.company?.account?.backgroundUrl || "",
      location: r.jobPost.location,
      type: r.jobPost.jobType?.name.toLowerCase() || "fulltime",
      arrangement: r.jobPost.jobArrangement?.name || "N/A",
      salary: { min: r.jobPost.min_salary, max: r.jobPost.max_salary },
      posted: r.jobPost.created_at,
      deadline: r.jobPost.deadline,
      applied: r.jobPost.applied || 0,
      status: r.jobPost.is_Published ? "open" : "expire",
      skills: r.jobPost.tags?.map(t => t.name) || [],
      description: {
        overview: r.jobPost.aboutRole,
        responsibility: r.jobPost.responsibilities || "",
        requirement: r.jobPost.requirements.join("\n"),
        qualification: r.jobPost.qualifications.join("\n"),
      },
      documents: [],
    };
  };

  const toggleGroup = (targetId: number) => {
    setExpandedGroups(prev => ({ ...prev, [targetId]: !prev[targetId] }));
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-3xl">Manage Reports</CardTitle>
          <CardDescription className="text-sm">Review all reports submitted by users</CardDescription>
        </CardHeader>

        {/* Filters */}
        <CardContent className="flex flex-col md:flex-row items-start md:items-center mt-0">
          <div className="flex flex-row flex-1 space-x-4">
            <div className="w-48">
              <Label>Target Type</Label>
              <Select value={targetType} onValueChange={(val) => { setTargetType(val as string); setReportTypeId("-1"); }}>
                <SelectTrigger><SelectValue placeholder="Select target type" /></SelectTrigger>
                <SelectContent>{targetTypeOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label>Report Type</Label>
              <Select value={reportTypeId} onValueChange={(val) => setReportTypeId(val as string)}>
                <SelectTrigger><SelectValue placeholder="Select report type" /></SelectTrigger>
                <SelectContent>{reportTypeOptions.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>

        {/* Reports List */}
        <div className="grid gap-4 mt-4">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center">
                <p className="text-lg font-medium">No reports found</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {Object.entries(
                reports.reduce((acc: Record<number, Report[]>, r) => {
                  if (r.target_id !== 0) {
                    if (!acc[r.target_id]) acc[r.target_id] = [];
                    acc[r.target_id].push(r);
                  } else {
                    acc[r.id] = [r];
                  }
                  return acc;
                }, {})
              ).map(([groupId, groupReports]) => {
                const firstReport = groupReports[0];

                if (firstReport.target_id === 0) {
                  return (
                    <Card key={firstReport.id} className="mb-4">
                      <CardHeader className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`w-3 h-3 rounded-full ${firstReport.is_resolved ? "bg-red-500" : "bg-green-500"}`} />
                          <CardTitle>{firstReport.reportType?.name || "N/A"}</CardTitle>
                        </div>
                        {!firstReport.is_resolved ? (
                          <Button variant="ghost" className="text-green-500" onClick={() => resolveReport(firstReport.id)}>
                            <CheckCircle />
                          </Button>
                        ) : (
                          <Button variant="ghost" className="text-red-500 cursor-not-allowed" disabled>
                            <XCircle />
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground"><strong>Reported by:</strong> {firstReport.account.username || firstReport.account.email}</p>
                        <p className="text-sm text-muted-foreground">{firstReport.description}</p>
                        {firstReport.jobPost && (
                          <JobDescriptionCard
                            job={mapJobInfoForDescription(firstReport)!}
                            size="md"
                            onApply={false}
                            onEdit={false}
                          />
                        )}
                      </CardContent>
                      <div className="text-right text-xs mt-2 text-gray-500">
                        Created at: {formatDate(firstReport.created_at)}
                      </div>
                    </Card>
                  );
                }

                // target_id != 0
                return (
                  <Card key={groupId} className="mb-4">
                    <CardContent>
                      {firstReport.jobPost && (
                        <JobDescriptionCard
                          job={mapJobInfoForDescription(firstReport)!}
                          size="md"
                          onApply={false}
                          onEdit={false}
                        />
                      )}
                      <div className="mt-4 space-y-2">
                        {groupReports.map((r, idx) => {
                          if (!expandedGroups[firstReport.target_id] && idx > 0) return null;
                          return (
                            <Card key={r.id} className="p-2">
                              <CardHeader className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <span className={`w-3 h-3 rounded-full ${r.is_resolved ? "bg-red-500" : "bg-green-500"}`} />
                                  <CardTitle className="text-sm">{r.reportType?.name || "N/A"}</CardTitle>
                                </div>
                                {!r.is_resolved ? (
                                  <Button variant="ghost" className="text-green-500" onClick={() => resolveReport(r.id)}>
                                    <CheckCircle />
                                  </Button>
                                ) : (
                                  <Button variant="ghost" className="text-red-500 cursor-not-allowed" disabled>
                                    <XCircle />
                                  </Button>
                                )}
                              </CardHeader>
                              <CardContent className="text-xs text-muted-foreground">
                                <p><strong>Reported by:</strong> {r.account.username || r.account.email}</p>
                                <p>{r.description}</p>
                                <div className="text-right text-gray-400 mt-1 text-[10px]">
                                  Created at: {formatDate(r.created_at)}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}

                        {groupReports.length > 1 && (
                          <Button size="sm" variant="link" onClick={() => toggleGroup(firstReport.target_id)}>
                            {expandedGroups[firstReport.target_id] ? "Show Less" : `Show More (${groupReports.length - 1} more)`}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>

        {/* Limit + Pagination */}
        <div className="flex justify-between items-center mt-2">
          <div className="w-24">
            <Label>Limit</Label>
            <Select value={String(limit)} onValueChange={(val) => setLimit(Number(val))}>
              <SelectTrigger><SelectValue placeholder="Limit" /></SelectTrigger>
              <SelectContent>{[5,10,20,50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button key={page} size="sm" variant={currentPage === page ? "default" : "outline"} onClick={() => setCurrentPage(page)}>
                {page}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}