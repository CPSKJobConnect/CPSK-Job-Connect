import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      username: string;
      profileComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?:string
    username?:string
  }
}

export type UserRole = "student" | "company";

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  // Student fields
  studentId?: string
  name?: string
  faculty?: string
  year?: number
  phone?: string
  transcript?: FileList
  // Company fields
  companyName?: string
  address?: string
  website?: string
  description?: string
}