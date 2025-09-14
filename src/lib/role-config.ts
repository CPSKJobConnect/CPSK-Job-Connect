// lib/role-config.ts
import { FormField, Role, RoleConfig } from "@/types/auth";
import { Building, GraduationCap } from "lucide-react";

export const ROLE_CONFIGS: Record<Role, RoleConfig> = {
  student: {
    role: "student",
    title: "Student",
    description: "Find internships and job opportunities",
    primaryColor: "bg-green-600 hover:bg-green-700",
    secondaryColor: "border-green-200 text-green-700 hover:bg-green-50",
    icon: GraduationCap,
    redirectPath: "student/dashboard",
  },
  company: {
    role: "company",
    title: "Company",
    description: "Connect with talented students",
    primaryColor: "bg-orange-600 hover:bg-orange-700",
    secondaryColor: "border-orange-200 text-orange-700 hover:bg-orange-50",
    icon: Building,
    redirectPath: "/company/dashboard",
  },
  admin: {
    role: "admin",
    title: "Admin",
    description: "Administrative access",
    primaryColor: "bg-blue-600 hover:bg-blue-700",
    secondaryColor: "border-blue-200 text-blue-700 hover:bg-blue-50",
    icon: Building,
    redirectPath: "/admin/dashboard",
  },
};

export const LOGIN_FIELDS: FormField[] = [
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
];

export const STUDENT_REGISTER_FIELDS: FormField[] = [
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Enter your username",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter your email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
    required: true,
  },
  {
    name: "studentId",
    label: "Student ID",
    type: "text",
    placeholder: "Enter your student ID",
    required: true,
  },
  {
    name: "name",
    label: "Full Name",
    type: "text",
    placeholder: "Enter your full name",
    required: true,
  },
  {
    name: "faculty",
    label: "Faculty",
    type: "text",
    placeholder: "Enter your faculty",
    required: true,
  },
  {
    name: "year",
    label: "Year",
    type: "number",
    placeholder: "Enter your year (1-8)",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "text",
    placeholder: "Enter your phone number",
    required: true,
  },
  {
    name: "transcript",
    label: "Transcript (Optional)",
    type: "file",
    accept: ".pdf,.doc,.docx",
    required: false,
  },
];

export const COMPANY_REGISTER_FIELDS: FormField[] = [
  {
    name: "username",
    label: "Username",
    type: "text",
    placeholder: "Enter company username",
    required: true,
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "Enter company email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    placeholder: "Enter your password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    placeholder: "Confirm your password",
    required: true,
  },
  {
    name: "companyName",
    label: "Company Name",
    type: "text",
    placeholder: "Enter company name",
    required: true,
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    placeholder: "Enter company address",
    required: true,
  },
  {
    name: "website",
    label: "Website (Optional)",
    type: "text",
    placeholder: "https://www.company.com",
    required: false,
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
    placeholder: "Describe your company",
    required: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "text",
    placeholder: "Enter company phone number",
    required: true,
  },
];

export function getFieldsForRole(role: Role, mode: 'login' | 'register'): FormField[] {
  if (mode === 'login') {
    return LOGIN_FIELDS;
  }
  
  switch (role) {
    case 'student':
      return STUDENT_REGISTER_FIELDS;
    case 'company':
      return COMPANY_REGISTER_FIELDS;
    default:
      return [];
  }
}