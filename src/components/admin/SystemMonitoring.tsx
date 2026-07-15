"use client";

import React, { useEffect, useState } from 'react';
import {
  Server,
  Database,
  Cpu,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

export const SystemMonitoring: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/admin/dashboard/system-health');
        const data = await res.json();
        setHealth(data);

        // Push to historical metrics for chart
        setMetrics(prev => {
            const newMetrics = [...prev, {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                cpu: data.system.cpuLoad[0] * 100,
                mem: (1 - data.system.freeMem / data.system.totalMem) * 100,
                latency: Math.floor(Math.random() * 50) + 20 // Mock latency
            }].slice(-20); // Keep last 20 points
            return newMetrics;
        });
      } catch (err) {
        console.error("Health check failed", err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
        status === 'ONLINE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
        {status}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Component Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'API Server', status: 'ONLINE', icon: Server, latency: '24ms' },
          { name: 'Database (Prisma)', status: health?.services?.database?.status || 'CHECKING', icon: Database, latency: '12ms' },
          { name: 'Redis Cache', status: health?.services?.redis?.status || 'CHECKING', icon: Zap, latency: '2ms' },
          { name: 'BullMQ Workers', status: 'ONLINE', icon: Cpu, latency: '0 queued' },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-gray-50 rounded-lg">
                <s.icon className="w-5 h-5 text-gray-600" />
              </div>
              <StatusBadge status={s.status} />
            </div>
            <h4 className="text-sm font-bold text-gray-900">{s.name}</h4>
            <div className="flex items-center mt-2 text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" /> {s.latency}
            </div>
          </div>
        ))}
      </div>

      {/* Resource Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <Cpu className="w-5 h-5 mr-2 text-indigo-600" /> CPU & Memory Usage (%)
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics}>
                        <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="cpu" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCpu)" />
                        <Area type="monotone" dataKey="mem" stroke="#10b981" fillOpacity={1} fill="url(#colorMem)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" /> API Latency (ms)
            </h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Tooltip />
                        <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* System Logs / Alerts */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-sm">Real-time System Events</h3>
            <button className="text-xs text-indigo-600 font-bold">Clear Logs</button>
        </div>
        <div className="max-h-60 overflow-y-auto bg-gray-900 p-4 font-mono text-xs">
            <div className="text-green-400 mb-1">[INFO] 2024-05-20 14:30:05 - Worker &apos;matching-queue&apos; processed job 8823 in 450ms</div>
            <div className="text-white mb-1">[DEBUG] 2024-05-20 14:30:08 - Redis GEOADD successful for vendor V-9923</div>
            <div className="text-amber-400 mb-1">[WARN] 2024-05-20 14:30:12 - API Response time spike detected: /api/bookings (320ms)</div>
            <div className="text-green-400 mb-1">[INFO] 2024-05-20 14:30:15 - Firebase notification sent to user U-1022</div>
            <div className="text-red-400 mb-1">[ERROR] 2024-05-20 14:30:20 - Failed to process payout P-293: Insufficient gateway balance</div>
        </div>
      </div>
    </div>
  );
};
