"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
// import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  Users,
  CheckCircle,
  XCircle,
  Briefcase,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface JobPost {
  id: number;
  jobName: string;
  company: {
    id: number;
    name: string;
    account: {
      email: string;
    };
  };
  location: string;
  minSalary: number;
  maxSalary: number;
  deadline: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  jobType: string;
  jobArrangement: string;
  categories: string[];
  tags: string[];
  applicationsCount: number;
  acceptedApplications: number;
}

interface ReferenceData {
  companies: Array<{ id: number; name: string; account: { email: string } }>;
  jobTypes: Array<{ id: number; name: string }>;
  jobArrangements: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function ManagePostPage() {
  const [jobPosts, setJobPosts] = useState<JobPost[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reportedFilter, setReportedFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const searchParams = useSearchParams();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedJobPost, setSelectedJobPost] = useState<JobPost | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    companyId: "",
    jobName: "",
    location: "",
    aboutRole: "",
    requirements: [] as string[],
    qualifications: [] as string[],
    minSalary: "",
    maxSalary: "",
    deadline: "",
    jobTypeId: "",
    jobArrangementId: "",
    categoryIds: [] as number[],
    tagIds: [] as number[]
  });
  const [requirementText, setRequirementText] = useState("");
  const [qualificationText, setQualificationText] = useState("");

  useEffect(() => {
    // Check if we came from dashboard with reported filter
    const filterParam = searchParams.get('filter');
    if (filterParam === 'reported') {
      setReportedFilter(true);
    }

    fetchJobPosts();
    fetchReferenceData();
  }, [currentPage, searchTerm, statusFilter, reportedFilter, searchParams]);

  const fetchJobPosts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(reportedFilter && { reported: "true" })
      });

      const response = await fetch(`/api/admin/job-posts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobPosts(data.jobPosts);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to fetch job posts");
      }
    } catch (error) {
      toast.error("Error fetching job posts");
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const response = await fetch("/api/admin/reference-data");
      if (response.ok) {
        const data = await response.json();
        setReferenceData(data);
      }
    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const handleCreateJobPost = async () => {
    try {
      const response = await fetch("/api/admin/job-posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          companyId: parseInt(formData.companyId),
          minSalary: parseInt(formData.minSalary),
          maxSalary: parseInt(formData.maxSalary),
          jobTypeId: parseInt(formData.jobTypeId),
          jobArrangementId: parseInt(formData.jobArrangementId)
        }),
      });

      if (response.ok) {
        toast.success("Job post created successfully");
        setIsCreateDialogOpen(false);
        resetForm();
        fetchJobPosts();
      } else {
        toast.error("Failed to create job post");
      }
    } catch (error) {
      toast.error("Error creating job post");
    }
  };

  const handleUpdateJobPost = async () => {
    if (!selectedJobPost) return;

    try {
      const response = await fetch(`/api/admin/job-posts/${selectedJobPost.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          companyId: parseInt(formData.companyId),
          minSalary: parseInt(formData.minSalary),
          maxSalary: parseInt(formData.maxSalary),
          jobTypeId: parseInt(formData.jobTypeId),
          jobArrangementId: parseInt(formData.jobArrangementId),
          isPublished: selectedJobPost.isPublished
        }),
      });

      if (response.ok) {
        toast.success("Job post updated successfully");
        setIsEditDialogOpen(false);
        resetForm();
        fetchJobPosts();
      } else {
        toast.error("Failed to update job post");
      }
    } catch (error) {
      toast.error("Error updating job post");
    }
  };

  const handleDeleteJobPost = async (id: number) => {
    if (!confirm("Are you sure you want to delete this job post?")) return;

    try {
      const response = await fetch(`/api/admin/job-posts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Job post deleted successfully");
        fetchJobPosts();
      } else {
        toast.error("Failed to delete job post");
      }
    } catch (error) {
      toast.error("Error deleting job post");
    }
  };

  const resetForm = () => {
    setFormData({
      companyId: "",
      jobName: "",
      location: "",
      aboutRole: "",
      requirements: [],
      qualifications: [],
      minSalary: "",
      maxSalary: "",
      deadline: "",
      jobTypeId: "",
      jobArrangementId: "",
      categoryIds: [],
      tagIds: []
    });
    setRequirementText("");
    setQualificationText("");
  };

  const openEditDialog = (jobPost: JobPost) => {
    setSelectedJobPost(jobPost);
    setFormData({
      companyId: jobPost.company.id.toString(),
      jobName: jobPost.jobName,
      location: jobPost.location,
      aboutRole: "",
      requirements: [],
      qualifications: [],
      minSalary: jobPost.minSalary.toString(),
      maxSalary: jobPost.maxSalary.toString(),
      deadline: jobPost.deadline.split('T')[0],
      jobTypeId: "",
      jobArrangementId: "",
      categoryIds: [],
      tagIds: []
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (jobPost: JobPost) => {
    setSelectedJobPost(jobPost);
    setIsViewDialogOpen(true);
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

  const addRequirement = () => {
    if (requirementText.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, requirementText.trim()]
      }));
      setRequirementText("");
    }
  };

  const addQualification = () => {
    if (qualificationText.trim()) {
      setFormData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualificationText.trim()]
      }));
      setQualificationText("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const removeQualification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading job posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Job Posts</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and manage job postings
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job Post
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by job title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="reported-filter" className="flex items-center gap-2 cursor-pointer">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Reported Posts Only
              </Label>
              <input
                id="reported-filter"
                type="checkbox"
                checked={reportedFilter}
                onChange={(e) => setReportedFilter(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Posts List */}
      <div className="grid gap-4">
        {jobPosts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium">No job posts found</p>
                <p className="text-muted-foreground">Create your first job post to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          jobPosts.map((jobPost) => (
            <Card key={jobPost.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{jobPost.jobName}</h3>
                      <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${jobPost.isPublished
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-transparent bg-secondary text-secondary-foreground"
                        }`}>
                        {jobPost.isPublished ? "Published" : "Draft"}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{jobPost.company.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{jobPost.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatCurrency(jobPost.minSalary)} - {formatCurrency(jobPost.maxSalary)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(jobPost.deadline)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{jobPost.applicationsCount} applications</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{jobPost.acceptedApplications} accepted</span>
                      </div>
                      <span>{jobPost.jobType} • {jobPost.jobArrangement}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openViewDialog(jobPost)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(jobPost)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteJobPost(jobPost.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Job Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job Post</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new job posting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company">Company</Label>
                <Select value={formData.companyId} onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData?.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobName">Job Title</Label>
                <Input
                  id="jobName"
                  value={formData.jobName}
                  onChange={(e) => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Bangkok, Thailand"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minSalary">Minimum Salary</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={formData.minSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, minSalary: e.target.value }))}
                  placeholder="30000"
                />
              </div>
              <div>
                <Label htmlFor="maxSalary">Maximum Salary</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={formData.maxSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxSalary: e.target.value }))}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={formData.jobTypeId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobTypeId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData?.jobTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jobArrangement">Work Arrangement</Label>
                <Select value={formData.jobArrangementId} onValueChange={(value) => setFormData(prev => ({ ...prev, jobArrangementId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select arrangement" />
                  </SelectTrigger>
                  <SelectContent>
                    {referenceData?.jobArrangements.map((arrangement) => (
                      <SelectItem key={arrangement.id} value={arrangement.id.toString()}>
                        {arrangement.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="deadline">Application Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="aboutRole">About the Role</Label>
              <Textarea
                id="aboutRole"
                value={formData.aboutRole}
                onChange={(e) => setFormData(prev => ({ ...prev, aboutRole: e.target.value }))}
                placeholder="Describe the role and responsibilities..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateJobPost}>
              Create Job Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Job Post Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJobPost?.jobName}</DialogTitle>
            <DialogDescription>
              Job post details and applications
            </DialogDescription>
          </DialogHeader>

          {selectedJobPost && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Company</Label>
                  <p className="text-sm font-medium">{selectedJobPost.company.name}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="text-sm font-medium">{selectedJobPost.location}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Salary Range</Label>
                  <p className="text-sm font-medium">
                    {formatCurrency(selectedJobPost.minSalary)} - {formatCurrency(selectedJobPost.maxSalary)}
                  </p>
                </div>
                <div>
                  <Label>Deadline</Label>
                  <p className="text-sm font-medium">{formatDate(selectedJobPost.deadline)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Job Type</Label>
                  <p className="text-sm font-medium">{selectedJobPost.jobType}</p>
                </div>
                <div>
                  <Label>Work Arrangement</Label>
                  <p className="text-sm font-medium">{selectedJobPost.jobArrangement}</p>
                </div>
              </div>

              <div>
                <Label>Applications</Label>
                <p className="text-sm font-medium">
                  {selectedJobPost.applicationsCount} total, {selectedJobPost.acceptedApplications} accepted
                </p>
              </div>

              {selectedJobPost.categories.length > 0 && (
                <div>
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedJobPost.categories.map((category, index) => (
                      <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold border-transparent bg-secondary text-secondary-foreground">
                        {category}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJobPost.tags.length > 0 && (
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedJobPost.tags.map((tag, index) => (
                      <div key={index} className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        {tag}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
