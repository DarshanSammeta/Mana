"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Clock,
  Camera,
  Music,
  User,
  Trash2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { vendorService } from "@/services/client";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface TeamMember {
    id: string;
    name: string;
    role: string;
    status: string;
    email: string | null;
    phone: string | null;
    joinedAt: string;
    avatar: string | null;
}

const ROLES_CONFIG = [
  { name: "Manager", icon: Shield, color: "text-accent", bg: "bg-accent/10" },
  { name: "Photographer", icon: Camera, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Staff", icon: Users, color: "text-primary", bg: "bg-primary/10" },
  { name: "Decorator", icon: Music, color: "text-amber-500", bg: "bg-amber-500/10" },
];

export default function TeamManagement() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [newMember, setNewMember] = useState({
      name: "",
      role: "Staff",
      email: "",
      phone: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTeam = async () => {
    try {
      const data = await vendorService.getTeam();
      setTeam(data);
    } catch {
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      try {
          await vendorService.addTeamMember(newMember);
          toast.success("Team member added successfully");
          setIsInviteOpen(false);
          setNewMember({ name: "", role: "Staff", email: "", phone: "" });
          fetchTeam();
      } catch {
          toast.error("Failed to add member");
      } finally {
          setSubmitting(false);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Are you sure you want to remove this team member?")) return;
      try {
          await vendorService.removeTeamMember(id);
          toast.success("Member removed");
          fetchTeam();
      } catch {
          toast.error("Failed to remove member");
      }
  };

  const roleStats = ROLES_CONFIG.map(role => ({
      ...role,
      count: team.filter(m => m.role.toLowerCase() === role.name.toLowerCase()).length
  }));

  if (loading) {
      return (
          <div className="flex h-[60vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage your staff and assign roles to your team members.</p>
        </div>

        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
                <button className="px-8 py-4 rounded-2xl bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Add Team Member
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Add New Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                        <Input
                            id="name"
                            value={newMember.name}
                            onChange={e => setNewMember({...newMember, name: e.target.value})}
                            placeholder="e.g. John Doe"
                            className="h-12 rounded-xl bg-secondary/50 border-none font-bold"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
                        <select
                            id="role"
                            value={newMember.role}
                            onChange={e => setNewMember({...newMember, role: e.target.value})}
                            className="w-full h-12 rounded-xl bg-secondary/50 border-none font-bold px-4 outline-none appearance-none"
                        >
                            {ROLES_CONFIG.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={newMember.email}
                                onChange={e => setNewMember({...newMember, email: e.target.value})}
                                placeholder="john@example.com"
                                className="h-12 rounded-xl bg-secondary/50 border-none font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone</Label>
                            <Input
                                id="phone"
                                value={newMember.phone}
                                onChange={e => setNewMember({...newMember, phone: e.target.value})}
                                placeholder="+91..."
                                className="h-12 rounded-xl bg-secondary/50 border-none font-bold"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20"
                    >
                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Member"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {roleStats.map((role, i) => (
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
              <h2 className="text-xl font-black">All Members ({team.length})</h2>
              <div className="flex items-center gap-2">
                    <div className="relative">
                        <input placeholder="Filter members..." className="pl-10 pr-4 py-2 bg-secondary/50 border-none rounded-xl text-xs font-bold w-48" />
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
              </div>
          </div>

          {team.length === 0 ? (
              <div className="text-center py-20 bg-secondary/20 rounded-[2rem] border-2 border-dashed border-border">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-muted-foreground">No team members added yet.</p>
                  <Button variant="link" className="text-primary font-black mt-2" onClick={() => setIsInviteOpen(true)}>Add your first member</Button>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map((member, i) => (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={member.id}
                        className="p-6 rounded-3xl border border-border/50 hover:border-primary/20 hover:shadow-xl transition-all group relative"
                    >
                        <div className="absolute top-4 right-4 flex gap-1">
                            <button
                                onClick={() => handleDelete(member.id)}
                                className="p-2 rounded-xl hover:bg-rose-50 text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                {member.avatar || member.name.substring(0, 2).toUpperCase()}
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
                            {member.email && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span className="font-medium truncate">{member.email}</span>
                                </div>
                            )}
                            {member.phone && (
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="font-medium">{member.phone}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span className="font-medium truncate">Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button className="flex-1 py-2.5 rounded-xl bg-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary/80 transition-all">Assign Permissions</button>
                            <button className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-primary hover:text-white transition-all">
                                <User className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
          )}
      </div>
    </div>
  );
}
