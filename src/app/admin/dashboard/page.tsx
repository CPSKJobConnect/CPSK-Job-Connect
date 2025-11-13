"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  BarChartComponent,
  PieChartComponent,
  LineChartComponent,
  HorizontalBarChart
} from "@/components/charts/ChartComponents";
import {
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  DollarSign,
  Target,
  Award,
  BarChart3
} from "lucide-react";

interface DashboardStats {
  pendingCompanies: number;
  totalJobPosts: number;
  totalStudents: number;
  totalCompanies: number;
  reportedPosts: number;
  averageSalary: {
    min: number;
    max: number;
    overall: number;
  };
  topHiringCompanies: Array<{
    id: number;
    name: string;
    jobPostsCount: number;
    totalApplications: number;
  }>;
  successRateByDepartment: Array<{
    faculty: string;
    totalStudents: number;
    acceptedApplications: number;
    successRate: number;
  }>;
  topSkills: Array<{
    name: string;
    count: number;
  }>;
  recentReports: Array<{
    id: number;
    type: string;
    createdAt: string;
    reporterEmail: string;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard/stats", {
        credentials: "include", // ✅ sends cookies/session token with request
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error("Failed to fetch dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const departmentData = stats.successRateByDepartment.map(dept => ({
    name: dept.faculty.includes("SKE") ? "SKE" : "CPE",
    value: dept.successRate
  }));

  const topCompaniesData = stats.topHiringCompanies.slice(0, 5).map(company => ({
    name: company.name.length > 15 ? company.name.substring(0, 15) + "..." : company.name,
    value: company.jobPostsCount
  }));

  const topSkillsData = stats.topSkills.slice(0, 8).map(skill => ({
    name: skill.name,
    value: skill.count
  }));

  const salaryData = [
    { name: "Min Salary", value: stats.averageSalary.min },
    { name: "Max Salary", value: stats.averageSalary.max },
    { name: "Average", value: stats.averageSalary.overall }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Overview of platform statistics and analytics
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BarChart3 className="w-4 h-4" />
          Last updated: {formatDate(new Date().toISOString())}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting verification
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Registered students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Job Posts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalJobPosts}</div>
            <p className="text-xs text-muted-foreground">
              Active job postings
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/admin/manage-post?filter=reported')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reported Posts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reportedPosts}</div>
            <p className="text-xs text-muted-foreground">
              Posts requiring review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Success Rate by Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent data={departmentData} height={300} />
            <div className="mt-4 space-y-2">
              {stats.successRateByDepartment.map((dept, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{dept.faculty.includes("SKE") ? "SKE" : "CPE"}</span>
                  <span className="font-medium">{dept.successRate.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Hiring Companies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Top Hiring Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={topCompaniesData} height={300} />
            <div className="mt-4 space-y-2">
              {stats.topHiringCompanies.slice(0, 5).map((company, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate">{company.name}</span>
                  <span className="font-medium">{company.jobPostsCount} jobs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Skills in Demand
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topSkills.length === 0 ? (
                <p className="text-muted-foreground">No skills found</p>
              ) : (
                <ol className="list-decimal list-inside space-y-1">
                  {stats.topSkills.map((skill, idx) => (
                    <li key={skill.name} className="flex justify-between items-center">
                      <span className="truncate mr-4">{skill.name}</span>
                      <span className="text-sm font-medium">{skill.count} jobs</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Average Salary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Average Salary Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={salaryData} height={300} />
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Minimum</span>
                <span className="font-medium">{formatCurrency(stats.averageSalary.min)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Maximum</span>
                <span className="font-medium">{formatCurrency(stats.averageSalary.max)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average</span>
                <span className="font-medium">{formatCurrency(stats.averageSalary.overall)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent reports</p>
            ) : (
              stats.recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">{report.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Reported by {report.reporterEmail}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(report.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
