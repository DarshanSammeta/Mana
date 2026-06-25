import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter, Globe, ChevronUp } from "lucide-react";

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
        <div>
          <h4 className="font-bold text-[16px] mb-4 text-white uppercase tracking-wider">Get to Know Us</h4>
          <ul className="space-y-3 text-[14px] text-gray-400">
            <li><Link href="/about" className="hover:text-white transition-colors">About Mana Events</Link></li>
            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            <li><Link href="/press" className="hover:text-white transition-colors">Press Releases</Link></li>
            <li><Link href="/impact" className="hover:text-white transition-colors">Community Impact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[16px] mb-4 text-white uppercase tracking-wider">Connect with Us</h4>
          <ul className="space-y-3 text-[14px] text-gray-400">
            <li><Link href="#" className="hover:text-white transition-colors">Facebook</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Twitter (X)</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">Instagram</Link></li>
            <li><Link href="#" className="hover:text-white transition-colors">LinkedIn</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[16px] mb-4 text-white uppercase tracking-wider">Business with Us</h4>
          <ul className="space-y-3 text-[14px] text-gray-400">
            <li><Link href="/vendor/register" className="hover:text-white transition-colors">Register as Vendor</Link></li>
            <li><Link href="/vendor/dashboard" className="hover:text-white transition-colors">Vendor Dashboard</Link></li>
            <li><Link href="/advertise" className="hover:text-white transition-colors">Advertise Services</Link></li>
            <li><Link href="/affiliate" className="hover:text-white transition-colors">Affiliate Program</Link></li>
            <li><Link href="/partners" className="hover:text-white transition-colors">Partner Central</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-[16px] mb-4 text-white uppercase tracking-wider">Support & Help</h4>
          <ul className="space-y-3 text-[14px] text-gray-400">
            <li><Link href="/customer/dashboard" className="hover:text-white transition-colors">Your Account</Link></li>
            <li><Link href="/customer/bookings" className="hover:text-white transition-colors">Manage Bookings</Link></li>
            <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/safety" className="hover:text-white transition-colors">Safety Guidelines</Link></li>
            <li><Link href="/disputes" className="hover:text-white transition-colors">Dispute Resolution</Link></li>
          </ul>
        </div>
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
           <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[12px] text-gray-400 mb-6 font-bold">
              <Link href="/terms" className="hover:underline">Conditions of Use & Sale</Link>
              <Link href="/privacy" className="hover:underline">Privacy Notice</Link>
              <Link href="/ads" className="hover:underline">Interest-Based Ads</Link>
              <Link href="/cookies" className="hover:underline">Cookies Policy</Link>
           </div>
           <p className="text-[12px] text-gray-500 text-center font-bold tracking-wider uppercase">© {new Date().getFullYear()}, ManaEvents.in, Inc. or its affiliates</p>
        </div>
      </div>
    </footer>
  );
}
