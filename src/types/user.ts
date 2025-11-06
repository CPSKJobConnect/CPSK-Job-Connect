import { FileMeta } from "./file";
import { Role } from "./auth";

export interface BaseUser {
    id: number;
    account_id: number;
    profile_url: string;
    bg_profile_url: string;
    email: string;
    role: Role;
  }
  
  // Student
  export interface Student extends BaseUser {
    role: "student";
    student_id: string;
    firstname: string;
    lastname: string;
    faculty: string;
    year: number | "Alumni"; // Can be 1-8 or "Alumni"
    phone: string;
    student_status: "CURRENT" | "ALUMNI";
    verification_status: "PENDING" | "APPROVED" | "REJECTED";
    documents: {
      resume: FileMeta[];
      cv: FileMeta[];
      portfolio: FileMeta[];
      transcript?: FileMeta[];
    }
  }
  
  // Company
  export interface Company extends BaseUser {
    role: "company";
    name: string;
    address: string[];
    description: string;
    department: string[];
    year: number;
    phone: string;
    registration_status: "PENDING" | "APPROVED" | "REJECTED";
    documents: {
      evidence: FileMeta[];
    };
  }
  
  // Admin
  export interface Admin extends BaseUser {
    role: "admin";
  }
  