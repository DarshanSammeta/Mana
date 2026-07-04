import { Metadata } from "next";
import Navbar from "@/components/common/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service | Mana Events",
  description: "Read the terms and conditions for using the Mana Events platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-black mb-8">Terms of Service</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-500 font-bold mb-4">Last Updated: June 2024</p>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Mana Events, you agree to be bound by these Terms of Service...</p>
          </section>
          {/* Add more placeholder sections as needed */}
          <p className="text-slate-500">This is a placeholder for the Terms of Service. Please update with legal content.</p>
        </div>
      </div>
    </div>
  );
}
