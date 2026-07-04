"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Camera,
  Save,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { customerService } from "@/services/customer.service";
import { notificationService } from "@/services/notification.service";

export default function CustomerSettings() {
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    location: ""
  });

  const [notificationPreferences, setNotificationPreferences] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        mobileNumber: user.mobileNumber || "",
        location: (user as any).location || ""
      });
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const data = await notificationService.getPreferences();
      setNotificationPreferences(data);
    } catch (error) {
      console.error("Failed to fetch preferences", error);
    }
  };

  const updatePreference = async (category: string, channel: string, value: boolean) => {
    try {
      const current = notificationPreferences.find(p => p.category === category) || {
        category, email: true, sms: false, push: true
      };
      const updated = { ...current, [channel]: value };

      await notificationService.updatePreferences(updated);

      setNotificationPreferences(prev => {
        const index = prev.findIndex(p => p.category === category);
        if (index > -1) {
          const newPrefs = [...prev];
          newPrefs[index] = updated;
          return newPrefs;
        }
        return [...prev, updated];
      });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update preference");
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await customerService.updateProfile(formData);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your profile, security, and notification preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navigation Sidebar */}
        <div className="lg:w-80 shrink-0">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-4 shadow-sm sticky top-6">
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all uppercase tracking-widest",
                    activeTab === tab.id
                      ? "bg-slate-900 text-white shadow-xl shadow-slate-200"
                      : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-primary" : "text-slate-400")} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-8">
          {activeTab === "profile" && (
            <motion.div variants={item} className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-10 py-10 border-b border-slate-100">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="relative group">
                      <div className="h-28 w-28 rounded-[2.5rem] bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/20">
                        {user?.fullName?.charAt(0) || "C"}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-3 bg-white rounded-2xl shadow-xl border border-slate-100 group-hover:scale-110 transition-transform">
                        <Camera className="h-5 w-5 text-primary" />
                      </button>
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl font-black text-slate-900">{user?.fullName || "Account Holder"}</h3>
                      <p className="text-slate-500 font-bold mt-1">{user?.email}</p>
                      <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-3">
                         <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1 rounded-full">Verified Account</Badge>
                         <Badge className="bg-blue-50 text-primary border-blue-100 font-bold px-3 py-1 rounded-full">CustomerSince 2024</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-10 space-y-8">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</Label>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
                      <Input value={user?.email || ""} disabled className="h-14 rounded-2xl border-slate-100 bg-slate-50 text-slate-400 font-bold cursor-not-allowed" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</Label>
                      <Input
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location / City</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end">
                    <Button
                      onClick={handleSaveChanges}
                      disabled={saving}
                      className="rounded-2xl gap-3 font-black px-10 h-14 bg-primary hover:bg-blue-700 shadow-xl shadow-primary/20 transition-all uppercase tracking-widest text-xs"
                    >
                      {saving ? (
                        <>Updating...</>
                      ) : (
                        <>
                          <Save className="h-5 w-5" />
                          Save Profile Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                      <Globe className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-slate-900">Language & Region</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">English (India), IST Timezone</p>
                      <Button variant="ghost" className="mt-4 p-0 h-auto text-primary font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-blue-700">Change Preferences</Button>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-rose-50/30 border border-rose-100 rounded-[2.5rem] shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                  <div className="flex items-start gap-5">
                    <div className="p-4 bg-rose-100 rounded-2xl group-hover:bg-rose-500 transition-colors">
                      <Trash2 className="h-6 w-6 text-rose-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-extrabold text-slate-900">Delete Account</h4>
                      <p className="text-sm text-slate-500 font-medium mt-1">Permanently remove your data.</p>
                      <Button variant="ghost" className="mt-4 p-0 h-auto text-rose-600 font-black text-xs uppercase tracking-widest hover:bg-transparent hover:text-rose-700">Deactivate Account</Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div variants={item} className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-primary">
                      <Shield className="h-7 w-7" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Security Settings</h2>
                      <p className="text-slate-500 font-medium">Protect your account with advanced security features.</p>
                   </div>
                </div>

                <div className="space-y-10">
                  <div className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-slate-100">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-lg font-extrabold text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500 font-medium mt-1">Recommended for high-value transaction accounts.</p>
                      </div>
                    </div>
                    <Button className="rounded-xl font-black uppercase tracking-widest text-[10px] px-8 py-6 h-auto bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200">Enable Now</Button>
                  </div>

                  <div className="space-y-8 pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Change Account Password</h4>
                    <div className="grid gap-8 max-w-xl">
                      <div className="space-y-2.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Password</Label>
                        <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold" />
                      </div>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">New Password</Label>
                          <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</Label>
                          <Input type="password" placeholder="••••••••••••" className="h-14 rounded-2xl border-slate-200 bg-slate-50/30 focus:bg-white transition-all font-bold" />
                        </div>
                      </div>
                      <Button className="w-fit rounded-2xl font-black uppercase tracking-widest text-xs px-10 h-14 bg-primary hover:bg-blue-700 shadow-xl shadow-primary/20">Update Security Password</Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div variants={item} className="space-y-8">
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                <div className="flex items-center gap-4 mb-10">
                   <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center text-primary">
                      <Bell className="h-7 w-7" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Notification Preferences</h2>
                      <p className="text-slate-500 font-medium">Choose how you want to be notified.</p>
                   </div>
                </div>

                <div className="space-y-6">
                  {["BOOKING", "PAYMENT", "CHAT", "SYSTEM"].map((category) => {
                    const pref = notificationPreferences.find(p => p.category === category) || {
                      email: true, sms: false, push: true
                    };
                    return (
                      <div key={category} className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
                        <h4 className="font-black text-sm text-slate-900 mb-6 uppercase tracking-widest">{category} Notifications</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-700">Email Notifications</p>
                              <p className="text-[10px] text-slate-500 font-medium">Receive updates via your registered email.</p>
                            </div>
                            <Switch
                              checked={pref.email}
                              onCheckedChange={(val) => updatePreference(category, "email", val)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-700">Push Notifications</p>
                              <p className="text-[10px] text-slate-500 font-medium">Get real-time alerts on your device.</p>
                            </div>
                            <Switch
                              checked={pref.push}
                              onCheckedChange={(val) => updatePreference(category, "push", val)}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-700">SMS Alerts</p>
                              <p className="text-[10px] text-slate-500 font-medium">Receive text messages for urgent updates.</p>
                            </div>
                            <Switch
                              checked={pref.sms}
                              onCheckedChange={(val) => updatePreference(category, "sms", val)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
