import { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In | Mana Events",
  description: "Sign in to your Mana Events account to manage your bookings, wishlist, and vendor profile.",
  openGraph: {
    title: "Sign In to Mana Events",
    description: "Access the premium event booking marketplace.",
  },
  robots: {
    index: false,
    follow: true,
  }
};

export default function LoginPage() {
  return <LoginClient />;
}
