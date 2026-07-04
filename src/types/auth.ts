export type UserRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  role: UserRole;
  profileImage?: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
