import { z } from "zod";

export const vendorDocumentSchema = z.object({
  type: z.enum(["AADHAAR", "PAN", "GST", "TRADE_LICENSE", "BUSINESS_LICENSE"]),
  url: z.string().url("Invalid document URL"),
});

export const vendorProfileSchema = z.object({
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  businessType: z.enum(["Individual", "Private Limited", "Partnership", "Proprietorship"]),
  description: z.string().min(20, "Description must be at least 20 characters"),
  categoryId: z.string().min(1, "Category is required"),
  subcategoryIds: z.array(z.string()).min(1, "At least one service is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zipCode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  serviceRadius: z.number().min(1, "Service radius must be at least 1km"),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN format"),
  aadhaarNumber: z.string().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  gstNumber: z.string().optional().or(z.literal("")),
  logo: z.string().url("Invalid logo URL"),
  coverImage: z.string().url("Invalid cover image URL"),
  bankDetails: z.object({
    bankName: z.string().min(2, "Bank name is required"),
    accountNumber: z.string().min(9, "Invalid account number"),
    ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
    upiId: z.string().optional().or(z.literal("")),
  }),
});

export type VendorDocumentInput = z.infer<typeof vendorDocumentSchema>;
export type VendorProfileInput = z.infer<typeof vendorProfileSchema>;
