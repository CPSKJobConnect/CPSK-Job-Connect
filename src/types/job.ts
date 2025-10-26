export interface SalaryRange {
  min: number;
  max: number;
}

export interface JobDescription {
  overview: string;
  responsibility: string;
  requirement: string;
  qualification: string;
}

export interface JobInfo {
  id: string;
  companyLogo: string;
  companyBg: string;
  title: string;
  companyName: string;
  category: string;
  location: string;
  posted: string;
  applied: number;
  salary: SalaryRange;
  skills: string[];
  description: JobDescription;
  type: string;
  arrangement: string;
  deadline: string;
  status: string;
  isSaved?: boolean;
}

export interface JobPostFormData {
  title: string;
  category: string;
  location: string;
  type: string;
  arrangement: string;
  salary: SalaryRange;
  posted: string;
  deadline: string;
  skills: string[];
  description: JobDescription;
}

export const defaultJobPostForm: JobPostFormData = {
  title: "",
  category: "",
  location: "",
  type: "",
  arrangement: "",
  salary: { min: 0, max: 0 },
  posted: "",
  deadline: "",
  skills: [],
  description: {
    overview: "",
    responsibility: "",
    requirement: "",
    qualification: "",
  },
};

export interface BookmarkJobInfo {
  job: JobInfo;
  added_at: string;
  isBookmarked: boolean;
  isApplied: boolean;
}

// API Response Types for Company Applications
export interface ApplicationStatus {
  id: number;
  name: string;
}

export interface ApplicationDocument {
  id: number;
  url: string;
  filename: string;
}

export interface Application {
  id: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  studentFaculty: string;
  studentYear: string;
  studentPhone: string;
  studentProfilePic: string | null;
  status: ApplicationStatus;
  appliedAt: Date;
  updatedAt: Date;
  resume: ApplicationDocument | null;
  portfolio: ApplicationDocument | null;
}

export interface JobCategory {
  id: number;
  name: string;
}

export interface JobTag {
  id: number;
  name: string;
}

export interface JobWithApplications {
  id: number;
  title: string;
  location: string;
  aboutRole: string;
  requirements: string[];
  qualifications: string[];
  type: string;
  arrangement: string;
  salary: SalaryRange;
  deadline: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  categories: JobCategory[];
  tags: JobTag[];
  totalApplications: number;
  applications: Application[];
  // Frontend-compatible fields
  description: JobDescription;
  companyLogo: string;
  companyBg: string;
  companyName: string;
  posted: string;
  applied: number;
  skills: string[];
  category: string;
  status: string;
  isSaved?: boolean; // Add optional isSaved field for compatibility with JobCard
}

export interface CompanyApplicationsResponse {
  success: boolean;
  data: JobWithApplications[];
}
