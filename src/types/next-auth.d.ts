import { DefaultSession } from "next-auth";
import { user_role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: user_role;
      email?: string | null;
      vendorId?: string;
      customerId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: user_role;
    vendorId?: string;
    customerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: user_role;
    vendorId?: string;
    customerId?: string;
  }
}
