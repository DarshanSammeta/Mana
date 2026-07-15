"use client";

import React from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  MapPin,
  AlertCircle,
  CreditCard,
  Truck
} from 'lucide-react';

interface TimelineEvent {
  status: string;
  notes?: string;
  createdAt: string;
  actor?: string;
}

interface BookingTimelineProps {
  events: TimelineEvent[];
}

export const BookingTimeline: React.FC<BookingTimelineProps> = ({ events }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'VENDOR_TRAVELING': return <Truck className="w-5 h-5 text-blue-500" />;
      case 'VENDOR_ARRIVED': return <MapPin className="w-5 h-5 text-indigo-500" />;
      case 'IN_PROGRESS': return <Clock className="w-5 h-5 text-amber-500" />;
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'PAYMENT_RELEASED': return <CreditCard className="w-5 h-5 text-purple-500" />;
      case 'EMERGENCY': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, idx) => (
          <li key={idx}>
            <div className="relative pb-8">
              {idx !== events.length - 1 && (
                <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
              )}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-white flex items-center justify-center ring-8 ring-white">
                    {getStatusIcon(event.status)}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {formatStatus(event.status)}
                    </p>
                    {event.notes && (
                      <p className="mt-0.5 text-xs text-gray-500 italic">
                        {event.notes}
                      </p>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-xs text-gray-400">
                    <time dateTime={event.createdAt}>
                      {new Date(event.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
