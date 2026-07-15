"use client";

import React, { useEffect, useState } from 'react';
import { Bell, X, Check, Search, Filter, ExternalLink } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  isRead: boolean;
  createdAt: string;
  deepLink?: string;
}

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications.filter(Boolean) : []);
      setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationIds: [id] }),
        headers: { 'Content-Type': 'application/json' }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <Check className="w-5 h-5 text-green-500" />;
      case 'WARNING': return <Bell className="w-5 h-5 text-amber-500" />;
      case 'ERROR': return <X className="w-5 h-5 text-red-500" />;
      default: return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">
                    {unreadCount} NEW
                </span>
            )}
        </div>
        <div className="flex space-x-2">
            <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <Search className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <Filter className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
        {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No notifications yet</div>
        ) : (
            notifications.map((n) => {
                if (!n) return null;
                return (
                <div
                    key={n.id}
                    className={`p-4 hover:bg-gray-50 transition-colors flex items-start space-x-4 ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    onClick={() => !n.isRead && markAsRead(n.id)}
                >
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className={`text-sm ${!n.isRead ? 'font-bold' : 'font-medium'} text-gray-900`}>{n.title}</h4>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                        {n.deepLink && (
                            <a
                                href={n.deepLink}
                                className="inline-flex items-center mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                            >
                                View Details <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        )}
                    </div>
                </div>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between">
        <button className="text-xs font-medium text-gray-500 hover:text-gray-700">Mark all as read</button>
        <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800">View All</button>
      </div>
    </div>
  );
};
