"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Mail, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/card";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

const ROLES = [
  "Team Leader", "Photographer", "Videographer", "Chef",
  "Decorator", "Sound Engineer", "Magician", "Anchor",
  "Helper", "Driver"
];

export function VendorTeamBuilder() {
    const queryClient = useQueryClient();
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({
        name: "",
        role: "Helper",
        email: "",
        phone: ""
    });

    const { data: teams, isLoading } = useQuery({
        queryKey: ["vendor-teams"],
        queryFn: async () => {
            const res = await apiClient.get("/vendor/teams");
            return res.data;
        }
    });

    const addTeamMutation = useMutation({
        mutationFn: async () => {
            const res = await apiClient.post("/vendor/teams", { name: "Execution Team", description: "Default event team" });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["vendor-teams"] })
    });

    const addMemberMutation = useMutation({
        mutationFn: async (teamId: string) => {
            const res = await apiClient.post("/vendor/members", { ...newMember, teamId });
            return res.data;
        },
        onSuccess: () => {
            toast.success("Member added to team");
            setIsAddingMember(false);
            setNewMember({ name: "", role: "Helper", email: "", phone: "" });
            queryClient.invalidateQueries({ queryKey: ["vendor-teams"] });
        }
    });

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    if (!teams || teams.length === 0) {
        return (
            <div className="p-20 text-center space-y-6">
                <Users className="h-16 w-16 text-slate-200 mx-auto" />
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Build Your Enterprise Team</h3>
                <p className="text-slate-500 max-w-sm mx-auto">Create a team to start assigning staff and team leaders to your bookings.</p>
                <Button onClick={() => addTeamMutation.mutate()} disabled={addTeamMutation.isPending}>
                    Create Default Team
                </Button>
            </div>
        );
    }

    const currentTeam = teams[0]; // Simplified for now: one main team

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Team Management</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage event staff and assignments</p>
                </div>
                <Button onClick={() => setIsAddingMember(true)} className="rounded-xl gap-2">
                    <Plus className="h-4 w-4" /> Add Staff Member
                </Button>
            </div>

            {isAddingMember && (
                <GlassCard className="p-8 border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</Label>
                            <Input value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} placeholder="e.g. Rahul Sharma" className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</Label>
                            <select
                                value={newMember.role}
                                onChange={e => setNewMember({...newMember, role: e.target.value})}
                                className="w-full h-10 rounded-xl border border-input px-3 text-sm font-bold"
                            >
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile</Label>
                            <Input value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} placeholder="10-digit number" className="rounded-xl" />
                        </div>
                        <div className="flex items-end gap-3">
                            <Button onClick={() => addMemberMutation.mutate(currentTeam.id)} disabled={addMemberMutation.isPending} className="flex-1 rounded-xl">Save</Button>
                            <Button variant="ghost" onClick={() => setIsAddingMember(false)} className="rounded-xl">Cancel</Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTeam.members.map((member: any) => (
                    <GlassCard key={member.id} className="p-6 hover:shadow-xl transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center text-primary font-black text-xl">
                                {member.avatar || member.name[0]}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">
                                {member.status}
                            </span>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-black text-slate-900 leading-tight">{member.name}</h4>
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{member.role}</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-50 space-y-2">
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Phone className="h-3 w-3" /> {member.phone}
                             </div>
                             <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Mail className="h-3 w-3" /> {member.email || "No email added"}
                             </div>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    );
}
