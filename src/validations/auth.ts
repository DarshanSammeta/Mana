import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["CUSTOMER", "VENDOR"]).optional().default("CUSTOMER"),
});

export const registerSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().length(10, "Mobile number must be exactly 10 digits"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  confirmPassword: z.string(),
  role: z.enum(["CUSTOMER", "VENDOR"]),
  referralCode: z.string().optional(),

  // Vendor Specific - Business Information
  businessName: z.string().min(3, "Business name is required").optional(),
  categoryId: z.string().min(1, "Business category is required").optional(),
  experienceYears: z.coerce.number().min(0, "Experience is required").optional(),
  description: z.string().optional(),

  // Vendor Specific - Business Location
  state: z.string().min(1, "State is required").optional(),
  city: z.string().min(1, "City is required").optional(),
  address: z.string().min(5, "Complete address is required").optional(),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits").optional(),

  // Vendor Specific - Verification (Optional)
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  aadhaarNumber: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.role === "VENDOR") {
    if (!data.businessName || data.businessName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business name must be at least 3 characters",
        path: ["businessName"],
      });
    }
    if (!data.categoryId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business category is required",
        path: ["categoryId"],
      });
    }
    if (data.experienceYears === undefined || data.experienceYears < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Years of experience is required",
        path: ["experienceYears"],
      });
    }
    if (!data.state) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required",
        path: ["state"],
      });
    }
    if (!data.city) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["city"],
      });
    }
    if (!data.address || data.address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Complete address is required (min 5 characters)",
        path: ["address"],
      });
    }
    if (!data.pincode || !/^\d{6}$/.test(data.pincode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valid 6-digit pincode is required",
        path: ["pincode"],
      });
    }
  }
});

export const verifyOTPSchema = z.object({
  email: z.string().email().optional(),
  userId: z.string().optional(),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export type LoginFormInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
