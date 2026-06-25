"use client";

import { useState } from "react";
import {
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  Lock,
  ChevronRight,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PaymentsPage() {
  const [cards, setCards] = useState([
    { id: 1, type: "VISA", last4: "4242", expiry: "12/26", isDefault: true, brand: "HDFC Bank" },
    { id: 2, type: "MASTERCARD", last4: "8890", expiry: "09/25", isDefault: false, brand: "ICICI Bank" },
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-sm text-gray-500">Manage your saved cards and payment preferences</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 font-bold rounded-xl">
          <Plus className="h-4 w-4 mr-2" />
          Add New Card
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {cards.map((card) => (
            <div
               key={card.id}
               className={cn(
                  "relative h-56 rounded-[2rem] p-8 text-white flex flex-col justify-between overflow-hidden shadow-xl transition-transform hover:scale-[1.02] cursor-pointer",
                  card.type === 'VISA' ? 'bg-gradient-to-br from-blue-600 to-indigo-900' : 'bg-gradient-to-br from-zinc-800 to-black'
               )}
            >
               <div className="absolute top-0 right-0 p-12 opacity-10 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />

               <div className="relative z-10 flex justify-between items-start">
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Debit Card</p>
                     <p className="text-sm font-bold mt-1">{card.brand}</p>
                  </div>
                  <div className="h-8 w-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center font-black italic text-xs">
                     {card.type}
                  </div>
               </div>

               <div className="relative z-10">
                  <p className="text-xl font-bold tracking-[0.2em]">•••• •••• •••• {card.last4}</p>
                  <div className="flex justify-between items-end mt-6">
                     <div>
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Expiry Date</p>
                        <p className="text-sm font-bold">{card.expiry}</p>
                     </div>
                     {card.isDefault && (
                        <Badge className="bg-white/20 text-white border-none font-bold text-[10px]">DEFAULT</Badge>
                     )}
                  </div>
               </div>

               <button className="absolute bottom-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                  <Trash2 className="h-4 w-4" />
               </button>
            </div>
         ))}

         <button className="h-56 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all group">
            <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-white shadow-sm">
               <Plus className="h-6 w-6" />
            </div>
            <p className="font-bold">Add New Card</p>
         </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
               <ShieldCheck className="h-5 w-5 text-green-600" /> Auto-Pay Settings
            </h3>
            <p className="text-sm text-gray-500 mb-6">Automatically pay for confirmed bookings using your default payment method.</p>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
               <span className="text-sm font-bold text-gray-700">Enable Auto-Pay</span>
               <div className="h-6 w-11 bg-gray-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full shadow-sm" />
               </div>
            </div>
         </div>

         <div className="bg-purple-50 rounded-3xl p-6 flex gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
               <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-purple-900">Secure Payments</h4>
               <p className="text-xs text-purple-700 mt-1 leading-relaxed opacity-80">
                  Mana Events uses end-to-end encryption. Your full card details are never stored on our servers. All transactions are processed via PCI-DSS compliant partners.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
