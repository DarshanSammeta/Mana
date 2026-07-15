"use client";

import React, { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/admin/DashboardShell';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Activity as ActivityIcon, DollarSign as DollarSignIcon, AlertTriangle as AlertTriangleIcon, Clock as ClockIcon,
  ShieldAlert as ShieldAlertIcon
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // In a real app, fetch from /api/admin/dashboard/live-stats
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/live-stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, []);

  const data = [
    { name: 'Mon', bookings: 40, revenue: 2400 },
    { name: 'Tue', bookings: 30, revenue: 1398 },
    { name: 'Wed', bookings: 20, revenue: 9800 },
    { name: 'Thu', bookings: 27, revenue: 3908 },
    { name: 'Fri', bookings: 18, revenue: 4800 },
    { name: 'Sat', bookings: 23, revenue: 3800 },
    { name: 'Sun', bookings: 34, revenue: 4300 },
  ];

  const pieData = [
    { name: 'Catering', value: 400 },
    { name: 'Decor', value: 300 },
    { name: 'Photography', value: 300 },
    { name: 'Music', value: 200 },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

  const statCards = [
    { label: 'Active Bookings', value: stats?.activeBookings || '0', icon: ActivityIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Revenue (Today)', value: '₹42,500', icon: DollarSignIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Pending Payouts', value: stats?.pendingPayouts || '0', icon: ClockIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Open Disputes', value: stats?.openDisputes || '0', icon: AlertTriangleIcon, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <DashboardShell>
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+12%</span>
            </div>
            <h3 className="text-sm font-medium text-gray-500">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Booking Velocity</h3>
            <select className="text-sm border-gray-300 rounded-md">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9ca3af'}} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-6">Category Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{((item.value/1200)*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Fraud & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Fraud Watch</h3>
            <button className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center p-3 rounded-lg border border-red-50 border-l-4 border-l-red-500 bg-red-50/30">
                <ShieldAlertIcon className="w-5 h-5 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Suspicious Location Jump</p>
                  <p className="text-xs text-gray-500">Vendor V-9823 moved 50km in 2 mins</p>
                </div>
                <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">System Queue</h3>
            <button className="text-indigo-600 text-sm font-medium hover:underline">Monitor</button>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-600">Booking Matching</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-600">Payout Processor</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">IDLE</span>
            </div>
            <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-600">SMS Gateway</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">DELAYED (2s)</span>
            </div>
            <div className="flex items-center justify-between p-2">
                <span className="text-sm text-gray-600">Image Processing</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">4 JOBS</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
