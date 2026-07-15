"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { CheckCircle2, Clock, MapPin, Truck, Play, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineEvent {
  status: string;
  timestamp: string;
  message: string;
  isCompleted: boolean;
}

const statusConfig: Record<string, { icon: any, color: string }> = {
  PENDING: { icon: Clock, color: 'text-slate-400' },
  ACCEPTED: { icon: CheckCircle2, color: 'text-blue-500' },
  CONFIRMED: { icon: CheckCircle2, color: 'text-emerald-500' },
  VENDOR_ASSIGNED: { icon: CheckCircle2, color: 'text-indigo-500' },
  VENDOR_TRAVELING: { icon: Truck, color: 'text-blue-600' },
  VENDOR_ARRIVED: { icon: MapPin, color: 'text-orange-500' },
  EVENT_STARTED: { icon: Play, color: 'text-purple-500' },
  EVENT_COMPLETED: { icon: CheckCircle, color: 'text-emerald-600' },
};

export function CustomerTimeline({ bookingId }: { bookingId: string }) {
  const { data: timeline, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['booking-timeline', bookingId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/bookings/${bookingId}/timeline`);
      return data;
    }
  });

  if (isLoading) return <div className="h-40 animate-pulse bg-slate-50 rounded-xl" />;
  if (!timeline) return null;

  return (
    <div className="space-y-8">
      {timeline.map((event, index) => {
        const Config = statusConfig[event.status] || { icon: Clock, color: 'text-slate-400' };
        return (
          <div key={index} className="flex gap-4 relative">
            {index !== timeline.length - 1 && (
              <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-slate-100" />
            )}
            <div className={cn("mt-1 shrink-0 z-10 p-1 bg-white rounded-full", Config.color)}>
              <Config.icon className="h-4 w-4" />
            </div>
            <div className="pb-6">
              <p className="text-sm font-bold text-slate-900">{event.message}</p>
              <p className="text-xs text-slate-500 mt-1">
                {format(new Date(event.timestamp), 'MMM dd, yyyy • hh:mm a')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
