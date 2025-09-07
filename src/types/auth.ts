// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth"
import { Role } from "./auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
      profileComplete: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: Role
    profileComplete: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    profileComplete: boolean
  }
}

// types/auth.ts
export type Role = "student" | "company" | "admin";

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  role: Role;
  // Student-specific fields
  studentId?: string;
  name?: string;
  faculty?: string;
  year?: number;
  phone?: string;
  transcript?: File;
  // Company-specific fields
  companyName?: string;
  address?: string;
  website?: string;
  description?: string;
}

export interface RoleConfig {
  role: Role;
  title: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  icon: React.ComponentType;
  redirectPath: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'file' | 'textarea';
  placeholder?: string;
  required?: boolean;
  accept?: string;
}