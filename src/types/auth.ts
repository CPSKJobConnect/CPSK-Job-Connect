import { DefaultSession } from "next-auth";
import React from "react";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      username: string;
      profileComplete: boolean;
      logoUrl?: string;
      backgroundUrl?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    username?: string;
    logoUrl?: string;
    backgroundUrl?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?:string
    username?:string
    logoUrl?:string
    backgroundUrl?:string
  }
}

export type UserRole = "student" | "company" | "admin";
export type Role = "student" | "company" | "admin";

export interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "file" | "textarea";
  placeholder?: string;
  required: boolean;
  accept?: string;
}

export interface RoleConfig {
  role: Role;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  redirectPath: string;
}

export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
  // Student fields
  studentId?: string
  name?: string
  faculty?: string
  year?: number | "Alumni"
  phone?: string
  transcript?: FileList
  // Company fields
  companyName?: string
  address?: string
  website?: string
  description?: string
}