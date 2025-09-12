import { FileMeta } from "./file";

export type Role = "student" | "company" | "admin";

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
    year: number;
    phone: string;
    documents: {
      resume: FileMeta[];
      cv: FileMeta[];
      portfolio: FileMeta[];
    }
  }
  
  // Company
  export interface Company extends BaseUser {
    role: "company";
    name: string;
    address: string;
    description: string;
    year: number;
    phone: string;
  }
  
  // Admin
  export interface Admin extends BaseUser {
    role: "admin";
  }
  