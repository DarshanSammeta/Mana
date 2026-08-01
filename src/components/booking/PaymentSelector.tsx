"use client";

import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Percent,
  CheckCircle2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const paymentMethods = [
  {
    id: "upi",
    title: "UPI",
    subtitle: "Google Pay, PhonePe, Paytm, BHIM",
    icon: Smartphone,
    brands: ["https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg"]
  },
  {
    id: "card",
    title: "Credit / Debit Card",
    subtitle: "Visa, Mastercard, RuPay, Amex",
    icon: CreditCard,
    brands: [
        "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg",
        "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
    ]
  },
  {
    id: "netbanking",
    title: "Net Banking",
    subtitle: "All major Indian banks",
    icon: Building2,
  },
  {
    id: "wallet",
    title: "Wallets",
    subtitle: "Amazon Pay, Mobikwik, etc.",
    icon: Wallet,
  },
  {
    id: "emi",
    title: "EMI",
    subtitle: "Credit card & Cardless EMI",
    icon: Percent,
  }
];

interface PaymentSelectorProps {
  onSelect: (id: string) => void;
  selectedMethod?: string;
}

export function PaymentSelector({ onSelect, selectedMethod }: PaymentSelectorProps) {
  return (
    <div className="space-y-4">
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <div
            key={method.id}
            onClick={() => onSelect(method.id)}
            className={cn(
              "p-5 rounded-[16px] border-2 transition-all cursor-pointer group relative overflow-hidden",
              isSelected
                ? "border-[#6D28D9] bg-[#6D28D9]/5 shadow-sm"
                : "border-slate-100 hover:border-[#6D28D9]/30 bg-white"
            )}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-[12px] flex items-center justify-center transition-colors",
                  isSelected ? "bg-[#6D28D9] text-white" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-tight">{method.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{method.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                 {method.brands && (
                    <div className="hidden sm:flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                       {method.brands.map((b, i) => (
                          <div key={i} className="relative h-3 w-10">
                            <Image src={b} alt="brand" fill className="object-contain" />
                          </div>
                       ))}
                    </div>
                 )}
                 <div className={cn(
                    "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-[#6D28D9] bg-[#6D28D9] text-white" : "border-slate-200"
                 )}>
                    {isSelected && <CheckCircle2 className="h-4 w-4" />}
                 </div>
              </div>
            </div>

            {isSelected && (
              <div className="mt-4 pt-4 border-t border-[#6D28D9]/10 animate-in fade-in slide-in-from-top-2 duration-300">
                 {method.id === "upi" && (
                    <div className="space-y-3">
                       <div className="relative">
                          <input
                            type="text"
                            placeholder="Enter UPI ID (e.g. user@okhdfc)"
                            className="w-full h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none"
                          />
                       </div>
                       <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1 tracking-wider">
                          <Info className="h-3 w-3" /> A collect request will be sent to your UPI app
                       </p>
                    </div>
                 )}
                 {method.id === "card" && (
                    <div className="space-y-3">
                       <input
                         type="text"
                         placeholder="Card Number"
                         className="w-full h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none"
                       />
                       <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            className="h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none"
                          />
                          <input
                            type="text"
                            placeholder="CVV"
                            className="h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none"
                          />
                       </div>
                    </div>
                 )}
                 {method.id === "netbanking" && (
                    <select className="w-full h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none appearance-none">
                       <option>Select your bank</option>
                       <option>HDFC Bank</option>
                       <option>ICICI Bank</option>
                       <option>SBI</option>
                       <option>Axis Bank</option>
                    </select>
                 )}
                 {/* Wallets */}
                 {method.id === "wallet" && (
                    <div className="grid grid-cols-2 gap-3">
                       {["Amazon Pay", "PhonePe", "Mobikwik", "Freecharge"].map(w => (
                          <button key={w} className="p-3 border border-slate-100 rounded-[12px] text-xs font-bold hover:border-[#6D28D9] hover:bg-[#6D28D9]/5 transition-all text-left">
                             {w}
                          </button>
                       ))}
                    </div>
                 )}

                 {/* EMI */}
                 {method.id === "emi" && (
                    <div className="space-y-3">
                       <select className="w-full h-12 bg-white rounded-[12px] px-4 text-sm font-bold border border-slate-200 focus:border-[#6D28D9] outline-none appearance-none">
                          <option>Select EMI Plan</option>
                          <option>3 Months @ 12% p.a.</option>
                          <option>6 Months @ 13% p.a.</option>
                          <option>9 Months @ 14% p.a.</option>
                          <option>12 Months @ 15% p.a.</option>
                       </select>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          EMI available on select credit cards
                       </p>
                    </div>
                 )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
