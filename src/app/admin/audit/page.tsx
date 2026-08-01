import { Suspense } from "react";
import AuditDashboardClient from "./AuditDashboardClient";

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse font-black italic uppercase">Loading Audit Logs...</div>}>
      <div className="p-8 space-y-8">
        <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Compliance & Audit Center</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">System-wide immutable activity logs</p>
        </div>
        <AuditDashboardClient />
      </div>
    </Suspense>
  );
}
