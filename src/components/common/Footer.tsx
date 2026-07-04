"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import { footerSections, legalLinks } from "@/data/common/footer";

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-[#111827] text-white font-sans">
      {/* Back to top */}
      <button
        onClick={scrollToTop}
        className="w-full bg-[#1F2937] hover:bg-[#374151] py-4 text-[13px] font-bold transition-colors border-b border-gray-700"
      >
        Back to top
      </button>

      {/* Main Links Area */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-12">
        {footerSections.map((section) => (
          <div key={section.title}>
            <h4 className="font-bold text-[16px] mb-4 text-white uppercase tracking-wider">{section.title}</h4>
            <ul className="space-y-3 text-[14px] text-gray-400">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} prefetch={false} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Divider and Logo Section */}
      <div className="border-t border-gray-800 py-12 bg-[#111827]">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-12">
          <Link href="/" className="transition-opacity hover:opacity-80">
             <span className="text-2xl font-black tracking-tight text-white">mana<span className="text-[#6D28D9]">Events</span></span>
          </Link>
          <div className="flex items-center gap-4">
             <div className="border border-gray-700 rounded-sm px-5 py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors">
                <Globe size={16} className="text-gray-400" />
                <span className="text-[13px] font-bold text-gray-300">English</span>
             </div>
             <div className="border border-gray-700 rounded-sm px-5 py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-800 transition-colors">
                <span className="text-[13px] font-bold text-gray-300">🇮🇳 India</span>
             </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Section */}
      <div className="bg-[#0F172A] py-12 px-6">
        <div className="max-w-[1200px] mx-auto">
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[12px] text-gray-300 mb-6 font-bold">
              {legalLinks.map((link) => (
                <Link key={link.label} href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              ))}
           </div>
           <p className="text-[12px] text-gray-400 text-center font-bold tracking-wider uppercase">© {new Date().getFullYear()}, ManaEvents.in, Inc. or its affiliates</p>
        </div>
      </div>
    </footer>
  );
}
