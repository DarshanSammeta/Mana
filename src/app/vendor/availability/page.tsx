"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Save,
  Clock,
  ShieldCheck,
  AlertCircle,
  Plus,
  ChevronRight,
  Zap,
  Moon,
  Sun,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function VendorAvailability() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [availability, setAvailability] = useState<any[]>([]);
  const [recurringRules, setRecurringRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentDay, setCurrentDay] = useState({
    isAvailable: true,
    startTime: "09:00",
    endTime: "18:00",
  });
  const { accessToken } = useAuthStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [availRes, recurringRes] = await Promise.all([
        axios.get("/api/vendor/availability", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("/api/vendor/availability/recurring", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ]);
      setAvailability(availRes.data);
      setRecurringRules(recurringRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchData();
  }, [accessToken]);

  useEffect(() => {
    if (date) {
      const found = availability.find(a =>
        new Date(a.date).toDateString() === date.toDateString()
      );
      if (found) {
        setCurrentDay({
          isAvailable: found.isAvailable,
          startTime: found.startTime || "09:00",
          endTime: found.endTime || "18:00",
        });
      } else {
        // Fallback to recurring rule if exists
        const dayOfWeek = date.getDay();
        const rule = recurringRules.find(r => r.dayOfWeek === dayOfWeek);
        if (rule) {
            setCurrentDay({
                isAvailable: rule.isAvailable,
                startTime: rule.startTime || "09:00",
                endTime: rule.endTime || "18:00",
            });
        } else {
            setCurrentDay({ isAvailable: true, startTime: "09:00", endTime: "18:00" });
        }
      }
    }
  }, [date, availability, recurringRules]);

  const handleSaveDay = async () => {
    if (!date) return;
    try {
      await axios.post("/api/vendor/availability", {
        date: date.toISOString(),
        ...currentDay
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Availability updated for " + date.toLocaleDateString());
      fetchData();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleSaveRecurring = async () => {
    try {
      await axios.post("/api/vendor/availability/recurring", {
        rules: recurringRules
      }, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast.success("Recurring rules updated");
      fetchData();
    } catch (error) {
      toast.error("Failed to save recurring rules");
    }
  };

  const updateRecurringRule = (dayOfWeek: number, field: string, value: any) => {
    setRecurringRules(prev => {
        const existing = prev.find(r => r.dayOfWeek === dayOfWeek);
        if (existing) {
            return prev.map(r => r.dayOfWeek === dayOfWeek ? { ...r, [field]: value } : r);
        } else {
            const newRule = { dayOfWeek, isAvailable: true, startTime: "09:00", endTime: "18:00", [field]: value };
            return [...prev, newRule];
        }
    });
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight">Availability Center</h2>
          <p className="text-muted-foreground text-lg mt-1">Manage your calendar and set booking preferences.</p>
        </div>
        <div className="flex gap-3">
             <Button variant="outline" className="rounded-xl font-bold gap-2" onClick={fetchData}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
            </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-secondary/50 p-1 rounded-2xl mb-8">
            <TabsTrigger value="calendar" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Calendar View</TabsTrigger>
            <TabsTrigger value="recurring" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Recurring Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-0">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Calendar View */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                        <CardHeader className="bg-secondary/30 pb-6">
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Schedule Explorer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-3xl border border-border/50 shadow-xl shadow-indigo-500/5 mx-auto"
                                classNames={{
                                    day_selected: "bg-primary text-white hover:bg-primary/90 rounded-xl",
                                    day_today: "bg-secondary text-primary font-bold rounded-xl",
                                    day: "h-14 w-14 text-center p-0 font-bold transition-all hover:bg-secondary/50 rounded-xl",
                                }}
                                modifiers={{
                                    unavailable: (d) => {
                                        const found = availability.find(a => new Date(a.date).toDateString() === d.toDateString());
                                        if (found) return !found.isAvailable;
                                        const rule = recurringRules.find(r => r.dayOfWeek === d.getDay());
                                        return rule ? !rule.isAvailable : false;
                                    }
                                }}
                                modifiersStyles={{
                                    unavailable: { textDecoration: 'line-through', color: '#94a3b8' }
                                }}
                            />
                        </CardContent>
                    </Card>

                    <div className="grid md:grid-cols-2 gap-6">
                        <GlassCard className="p-8 border-none" animateHover>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <Sun className="h-5 w-5 text-emerald-500" />
                                </div>
                                <h4 className="font-black">Standard Hours</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">Your default working hours are controlled by recurring rules.</p>
                        </GlassCard>

                        <GlassCard className="p-8 border-none" animateHover>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                    <Moon className="h-5 w-5 text-indigo-500" />
                                </div>
                                <h4 className="font-black">Date Overrides</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">Specific date settings always override your weekly schedule.</p>
                        </GlassCard>
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-6">
                    <motion.div variants={item}>
                        <Card className="border-none shadow-xl bg-card rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="bg-primary text-white pb-8 pt-8">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">Selected Date</p>
                                <h3 className="text-2xl font-black">{date?.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</h3>
                            </CardHeader>
                            <CardContent className="p-8 -mt-4 bg-card rounded-t-[2.5rem] space-y-8">
                                <div className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50">
                                    <div className="space-y-0.5">
                                        <Label className="font-black text-sm">Status</Label>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                            {currentDay.isAvailable ? "Available for bookings" : "Fully Blocked"}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={currentDay.isAvailable}
                                        onCheckedChange={(checked) => setCurrentDay({...currentDay, isAvailable: checked})}
                                    />
                                </div>

                                {currentDay.isAvailable ? (
                                    <div className="space-y-6">
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Time</Label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        className="w-full bg-secondary/50 border-none rounded-xl h-12 px-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                        value={currentDay.startTime}
                                                        onChange={(e) => setCurrentDay({...currentDay, startTime: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Time</Label>
                                                <div className="relative">
                                                    <input
                                                        type="time"
                                                        className="w-full bg-secondary/50 border-none rounded-xl h-12 px-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                                        value={currentDay.endTime}
                                                        onChange={(e) => setCurrentDay({...currentDay, endTime: e.target.value})}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0" />
                                            <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase tracking-widest">Changes will apply only to {date?.toLocaleDateString()}.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center space-y-4">
                                        <div className="h-16 w-16 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mx-auto">
                                            <Moon className="h-8 w-8 text-rose-500" />
                                        </div>
                                        <p className="text-sm font-bold text-muted-foreground">This day is currently marked as unavailable.</p>
                                    </div>
                                )}

                                <Button className="w-full h-14 rounded-2xl gap-2 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" onClick={handleSaveDay}>
                                    <Save className="h-5 w-5" /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </TabsContent>

        <TabsContent value="recurring">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
                <CardHeader className="bg-secondary/30 pb-6">
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Weekly Recurring Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        {DAYS.map((day, index) => {
                            const rule = recurringRules.find(r => r.dayOfWeek === index) || { dayOfWeek: index, isAvailable: true, startTime: "09:00", endTime: "18:00" };
                            return (
                                <div key={day} className="flex flex-col md:flex-row items-center justify-between p-6 rounded-3xl bg-secondary/20 border border-border/30 gap-6">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <div className={`p-3 rounded-2xl ${rule.isAvailable ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                            {rule.isAvailable ? <Sun className="h-5 w-5 text-emerald-500" /> : <Moon className="h-5 w-5 text-rose-500" />}
                                        </div>
                                        <Label className="font-black text-lg">{day}</Label>
                                    </div>

                                    <div className="flex items-center gap-8 flex-1 justify-end">
                                        <div className="flex items-center gap-4">
                                            <Switch
                                                checked={rule.isAvailable}
                                                onCheckedChange={(checked) => updateRecurringRule(index, 'isAvailable', checked)}
                                            />
                                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground w-20">
                                                {rule.isAvailable ? 'Available' : 'Closed'}
                                            </span>
                                        </div>

                                        <div className={`flex items-center gap-4 transition-opacity ${!rule.isAvailable ? 'opacity-20 pointer-events-none' : ''}`}>
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <input
                                                    type="time"
                                                    value={rule.startTime}
                                                    onChange={(e) => updateRecurringRule(index, 'startTime', e.target.value)}
                                                    className="bg-white border-none rounded-xl h-10 px-3 font-bold text-sm shadow-sm outline-none"
                                                />
                                            </div>
                                            <span className="font-bold text-muted-foreground">to</span>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={rule.endTime}
                                                    onChange={(e) => updateRecurringRule(index, 'endTime', e.target.value)}
                                                    className="bg-white border-none rounded-xl h-10 px-3 font-bold text-sm shadow-sm outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-10 flex justify-end">
                        <Button className="h-14 px-10 rounded-2xl gap-2 font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]" onClick={handleSaveRecurring}>
                            <Save className="h-5 w-5" /> Save Weekly Schedule
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
