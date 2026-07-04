"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface EventTypeSidebarProps {
  eventTypes: any[];
}

export function EventTypeSidebar({ eventTypes }: EventTypeSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeId = searchParams?.get("eventTypeId") || "";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100">
      <h3 className="font-black text-[#111827] uppercase tracking-tighter text-lg mb-6">Event Type</h3>
      <div className="space-y-3">
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams?.toString() || "");
            params.delete("eventTypeId");
            params.delete("eventName");
            router.push(`/marketplace?${params.toString()}`, { scroll: false });
          }}
          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            !activeId ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Events
        </button>
        {eventTypes?.map((type: any) => (
          <button
            key={type.id}
            onClick={() => {
              const params = new URLSearchParams(searchParams?.toString() || "");
              params.set("eventTypeId", type.id);
              params.set("eventName", type.name);
              // Clear category when switching event type to avoid mismatch
              params.delete("category");
              params.delete("subcategory");
              router.push(`/marketplace?${params.toString()}`, { scroll: false });
            }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              activeId === type.id ? 'bg-primary text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>
    </div>
  );
}
