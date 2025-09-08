import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const baseRegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(), 

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const studentRegisterSchema = baseRegisterSchema.extend({
  studentId: z.string().length(10, "Student ID must be 10 characters").regex(/^\d+$/, "Student ID must be numeric"),
  name: z.string().min(3, "Name is required"),
  faculty: z.enum(
    ["Software and Knowledge Engineering (SKE)", "Computer Engineering (CPE)"],
    {
      error: "Faculty is required",
      message: "Faculty must be SKE or CPE",
    }
  ),
  year: z.union([
    z.number().min(1).max(8, {message: "Year must be between 1 and 8"}),
    z.literal("Alumni"),
  ]),
  phone: z.string().regex(/^\d{10,}$/, "Phone number must be at least 10 digits and only digits"),
  transcript: z.instanceof(File).optional(), // Only optional for testing purposes.
});

export const companyRegisterSchema =  baseRegisterSchema.extend({
  companyName: z.string().min(3, "Company name is required"),
  address: z.string().min(3, "Address is required"),
  website: z.string().url("Website must be a valid URL"),
  description: z.string().min(10,  "Description must be atleast 10 characters."),
  phone: z.string().regex(/^\d{10,}$/, "Phone number must be at least 10 digits and only digits"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type StudentRegisterFormData = z.infer<typeof studentRegisterSchema>;
export type CompanyRegisterFormData = z.infer<typeof companyRegisterSchema>;