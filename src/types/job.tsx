export interface JobInfo {
    companyLogo: string;
    companyBg: string;
    jobName: string;
    companyName: string;
    location: string;
    posted: string;
    applied: number;
    tags: string[];
    description: {
      aboutRole: string;
      requirements: string[];
      qualifications: string[];
    };
    type: string;
  }
  