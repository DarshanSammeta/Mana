"use client";

import { format } from "date-fns";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Handshake,
  Navigation,
  MapPin,
  ShieldCheck,
  PartyPopper,
  DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  status: string;
  notes?: string;
  createdAt: string | Date;
}

interface BookingTimelineProps {
  logs: TimelineEvent[];
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "PENDING":
      return { icon: Clock, color: "text-amber-500", bg: "bg-amber-50", label: "Booking Requested" };
    case "ACCEPTED":
      return { icon: Handshake, color: "text-blue-500", bg: "bg-blue-50", label: "Vendor Accepted" };
    case "NEGOTIATING":
      return { icon: DollarSign, color: "text-purple-500", bg: "bg-purple-50", label: "Negotiation Started" };
    case "CONFIRMED":
      return { icon: ShieldCheck, color: "text-green-500", bg: "bg-green-50", label: "Booking Confirmed" };
    case "VENDOR_TRAVELING":
      return { icon: Navigation, color: "text-indigo-500", bg: "bg-indigo-50", label: "En Route" };
    case "VENDOR_ARRIVED":
      return { icon: MapPin, color: "text-rose-500", bg: "bg-rose-50", label: "Arrived at Venue" };
    case "EVENT_STARTED":
      return { icon: PartyPopper, color: "text-emerald-500", bg: "bg-emerald-50", label: "Event Started" };
    case "EVENT_COMPLETED":
      return { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100", label: "Event Completed" };
    case "CANCELLED":
      return { icon: AlertCircle, color: "text-gray-500", bg: "bg-gray-50", label: "Cancelled" };
    default:
      return { icon: MessageSquare, color: "text-gray-400", bg: "bg-gray-50", label: status };
  }
};

export function BookingTimeline({ logs }: BookingTimelineProps) {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {logs.map((event, eventIdx) => {
          const config = getStatusConfig(event.status);
          const Icon = config.icon;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== logs.length - 1 ? (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span
                      className={cn(
                        config.bg,
                        config.color,
                        "h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {config.label}
                      </p>
                      {event.notes && (
                        <p className="mt-0.5 text-xs text-gray-500 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500">
                      <time dateTime={new Date(event.createdAt).toISOString()}>
                        {format(new Date(event.createdAt), "MMM d, h:mm a")}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
