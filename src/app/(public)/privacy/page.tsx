import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Mana Events",
  description: "Learn how Mana Events collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-500 font-bold mb-4">Last Updated: June 2024</p>
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account...</p>
          </section>
          {/* Add more placeholder sections as needed */}
          <p className="text-slate-500">This is a placeholder for the Privacy Policy. Please update with legal content.</p>
        </div>
      </div>
    </div>
  );
}
