export interface JobInfo {
    companyLogo: string;
    companyBg: string;
    jobName: string;
    companyName: string;
    category: string[];
    location: string;
    posted: string;
    applied: number;
    minSalary: string;
    maxSalary: string;
    tags: string[];
    description: {
      aboutRole: string;
      requirements: string[];
      qualifications: string[];
    };
    type: string;
    arrangement: string;
  }
  