import { DefaultSession } from "next-auth";
import { user_role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: user_role;
      email?: string | null;
      vendorId?: string;
      customerProfileId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: user_role;
    vendorId?: string;
    customerProfileId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: user_role;
    vendorId?: string;
    customerProfileId?: string;
  }
}
