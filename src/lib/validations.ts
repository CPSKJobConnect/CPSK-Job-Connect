import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  studentId: z.string().length(10, "Student ID must be 10 characters").regex(/^\d+$/, "Student ID must be numeric"),
  name: z.string().min(3, "Name is required"),
  faculty: z.enum(
    ["Software and Knowledge Engineering (SKE)", "Computer Engineering (CPE)"],
    {
      message: "Faculty must be SKE or CPE",
    }
  ),
  year: z.union([
    z.number().min(1).max(8, {message: "Year must be between 1 and 8"}),
    z.literal("Alumni"),
  ]),
  phone: z.string().regex(/^\d{10,}$/, "Phone number must be at least 10 digits and only digits"),
  transcript: z.instanceof(File).optional(),
  studentStatus: z.enum(["CURRENT", "ALUMNI"]).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Alumni must upload transcript
  if (data.studentStatus === "ALUMNI" && !data.transcript) {
    return false;
  }
  return true;
}, {
  message: "Alumni must upload a transcript",
  path: ["transcript"],
});

export const companyRegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  companyName: z.string().min(3, "Company name is required"),
  address: z.string().min(3, "Address is required"),
  // year: z.number().min(1800, "Year must be valid").max(new Date().getFullYear(), "Year cannot be in the future"),
  website: z.string().url("Website must be a valid URL").or(z.literal("")).optional(),
  description: z.string().min(10,  "Description must be atleast 10 characters."),
  phone: z.string().regex(/^\d{10,}$/, "Phone number must be at least 10 digits and only digits"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentRegisterFormData = z.infer<typeof studentRegisterSchema>;
export type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>;