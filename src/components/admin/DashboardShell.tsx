"use client";

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings,
  AlertTriangle,
  Activity,
  DollarSign,
  Map as MapIcon,
  ShieldAlert,
  Bell
} from 'lucide-react';
import Link from 'next/link';

interface DashboardShellProps {
  children: React.ReactNode;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { id: 'bookings', name: 'Live Bookings', icon: Activity, href: '/admin/bookings' },
    { id: 'vendors', name: 'Vendor Network', icon: MapIcon, href: '/admin/vendors' },
    { id: 'revenue', name: 'Revenue & Payouts', icon: DollarSign, href: '/admin/finance' },
    { id: 'disputes', name: 'Disputes', icon: AlertTriangle, href: '/admin/disputes' },
    { id: 'safety', name: 'Safety & Fraud', icon: ShieldAlert, href: '/admin/safety' },
    { id: 'notifications', name: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { id: 'system', name: 'System Health', icon: Settings, href: '/admin/system' },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 flex items-center space-x-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
          <span className="text-xl font-bold text-gray-900">Mana Admin</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab(item.id)}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
            <div className="flex items-center p-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    A
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">Super Admin</p>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
            <h1 className="text-lg font-semibold text-gray-900 capitalize">
                {activeTab.replace('-', ' ')}
            </h1>
            <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-600 relative">
                    <Bell className="w-6 h-6" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Emergency Mode
                </button>
            </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
