"use client";

import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  MoreVertical,
  Clock,
  Camera,
  Music,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const team = [
  {
    name: "Alex Rivera",
    role: "Manager",
    status: "Active",
    email: "alex@manaevents.com",
    phone: "+91 98271 28192",
    joined: "12 Jan 2026",
    avatar: "AR"
  },
  {
    name: "Sarah Chen",
    role: "Photographer",
    status: "On Site",
    email: "sarah@manaevents.com",
    phone: "+91 98271 28193",
    joined: "15 Jan 2026",
    avatar: "SC"
  },
  {
    name: "David Kumar",
    role: "Decorator",
    status: "Active",
    email: "david@manaevents.com",
    phone: "+91 98271 28194",
    joined: "20 Jan 2026",
    avatar: "DK"
  },
  {
    name: "Riya Sharma",
    role: "Coordinator",
    status: "Away",
    email: "riya@manaevents.com",
    phone: "+91 98271 28195",
    joined: "05 Feb 2026",
    avatar: "RS"
  }
];

const roles = [
  { name: "Manager", icon: Shield, color: "text-accent", bg: "bg-accent/10", count: 1 },
  { name: "Photographer", icon: Camera, color: "text-blue-500", bg: "bg-blue-500/10", count: 4 },
  { name: "Staff", icon: Users, color: "text-primary", bg: "bg-primary/10", count: 8 },
  { name: "Decorator", icon: Music, color: "text-amber-500", bg: "bg-amber-500/10", count: 3 },
];

export default function TeamManagement() {
  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your staff and assign roles to your team members.</p>
        </div>
        <button className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Invite Team Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {roles.map((role, i) => (
              <div key={i} className="p-6 rounded-3xl bg-card border border-border/50">
                  <div className={cn("h-10 w-10 rounded-xl mb-4 flex items-center justify-center", role.bg)}>
                    <role.icon className={cn("h-5 w-5", role.color)} />
                  </div>
                  <h3 className="font-bold">{role.name}</h3>
                  <p className="text-2xl font-black mt-1">{role.count}</p>
              </div>
          ))}
      </div>

      <div className="p-8 rounded-[32px] bg-card border border-border/50">
          <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black">All Members</h2>
              <div className="flex items-center gap-2">
                    <div className="relative">
                        <input placeholder="Filter members..." className="pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-xl text-xs font-bold w-48" />
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {team.map((member, i) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    key={i}
                    className="p-6 rounded-3xl border border-border/50 hover:border-primary/20 hover:shadow-xl transition-all group relative"
                  >
                      <button className="absolute top-4 right-4 p-2 rounded-xl hover:bg-secondary transition-colors">
                          <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </button>

                      <div className="flex items-center gap-4 mb-6">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                              {member.avatar}
                          </div>
                          <div>
                              <h3 className="font-black text-lg">{member.name}</h3>
                              <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">{member.role}</span>
                                  <span className={cn(
                                      "h-2 w-2 rounded-full",
                                      member.status === "Active" ? "bg-emerald-500" :
                                      member.status === "On Site" ? "bg-amber-500" : "bg-muted"
                                  )} />
                                  <span className="text-[10px] font-bold text-muted-foreground">{member.status}</span>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-3 pt-4 border-t border-border/50">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="font-medium truncate">{member.email}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span className="font-medium">{member.phone}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">Joined {member.joined}</span>
                          </div>
                      </div>

                      <div className="mt-6 flex gap-2">
                          <button className="flex-1 py-2.5 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all">Manage Permissions</button>
                          <button className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-rose-50 hover:text-rose-500 transition-all">
                              <User className="h-4 w-4" />
                          </button>
                      </div>
                  </motion.div>
              ))}
          </div>
      </div>
    </div>
  );
}
