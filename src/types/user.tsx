export type Role = "student" | "company" | "admin";

export interface BaseUser {
    id: number;
    account_id: number;
    name: string;
    role: Role;
  }
  
  // Student
  export interface Student extends BaseUser {
    role: "student";
    student_id: string;
    faculty: string;
    year: number;
    phone: string;
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
  