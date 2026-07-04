import { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Create Account | Mana Events",
  description: "Join Mana Events today. Create a customer or vendor account to start booking or selling premium event services.",
  openGraph: {
    title: "Join Mana Events",
    description: "The premium marketplace for event planning professionals.",
  },
  robots: {
    index: false,
    follow: true,
  }
};

export default function RegisterPage() {
  return <RegisterClient />;
}
