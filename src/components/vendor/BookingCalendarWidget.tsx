"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-emerald-500",
  PREPARATION_STARTED: "bg-indigo-500",
  VENDOR_ASSIGNED: "bg-blue-500",
  EVENT_STARTED: "bg-rose-500",
  VENDOR_REVIEW: "bg-amber-500",
  BALANCE_PENDING: "bg-orange-500",
};

export function BookingCalendarWidget() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const { data: bookings } = useQuery({
        queryKey: ["vendor-calendar", format(currentMonth, "yyyy-MM")],
        queryFn: async () => {
            const res = await apiClient.get("/vendor/dashboard/calendar", {
                params: {
                    start: startOfMonth(currentMonth).toISOString(),
                    end: endOfMonth(currentMonth).toISOString()
                }
            });
            return res.data;
        }
    });

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <GlassCard className="p-6 border-slate-100 h-full">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 italic">Schedule Calendar</h3>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-xs font-black uppercase tracking-tighter w-24 text-center">{format(currentMonth, "MMMM yyyy")}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-[10px] font-black text-slate-300 text-center py-2">{d}</div>
                ))}
                {days.map((day) => {
                    const dayBookings = bookings?.filter((b: any) => isSameDay(new Date(b.eventDate), day)) || [];
                    const hasBookings = dayBookings.length > 0;

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center relative border transition-all",
                                isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:bg-slate-50",
                                hasBookings ? "cursor-pointer" : ""
                            )}
                        >
                            <span className={cn(
                                "text-xs font-bold",
                                isToday(day) ? "text-primary" : "text-slate-600",
                                hasBookings ? "font-black" : ""
                            )}>
                                {format(day, "d")}
                            </span>
                            <div className="flex gap-0.5 mt-1">
                                {dayBookings.slice(0, 3).map((b: any) => (
                                    <div key={b.id} className={cn("h-1 w-1 rounded-full", STATUS_COLORS[b.status] || "bg-slate-300")} />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 flex flex-wrap gap-3">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className={cn("h-1.5 w-1.5 rounded-full", color)} />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{status.replace("_", " ")}</span>
                    </div>
                ))}
            </div>
        </GlassCard>
    );
}
