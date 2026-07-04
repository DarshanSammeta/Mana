import PortfolioClient from "./PortfolioClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Manager | Vendor Dashboard",
  description: "Manage your professional event portfolio and showcase your best work.",
};

export default function PortfolioPage() {
  return <PortfolioClient />;
}
