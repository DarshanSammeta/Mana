"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  User,
  Lock,
  Shield,
  CreditCard,
  Globe,
  Camera,
  Save,
  Briefcase,
  FileText,
  BadgeCheck,
  Upload,
  Trash2,
  LogOut,
  Smartphone,
  AlertCircle,
  Loader2,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { vendorService } from "@/services/client";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorProfileSchema } from "@/validations/vendor";
import { cn } from "@/lib/utils";
import { z } from "zod";

export default function VendorSettings() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await vendorService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const data = await vendorService.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchSessions();
  }, []);

  const tabs = [
    { id: "business", label: "Business Profile", icon: Store },
    { id: "account", label: "Account Admin", icon: User },
    { id: "verification", label: "Verification", icon: BadgeCheck },
    { id: "billing", label: "Payouts", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse">Loading settings...</p>
      </div>
    );
  }

  const handleRevokeSession = async (id: string) => {
    try {
      setRevokingSession(id);
      await vendorService.revokeSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      toast.success("Session revoked");
    } catch {
      toast.error("Failed to revoke session");
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await vendorService.revokeOtherSessions();
      fetchSessions();
      toast.success("Other sessions revoked");
    } catch {
      toast.error("Failed to revoke sessions");
    }
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
      initial="hidden"
      animate="show"
      className="space-y-6 md:space-y-8 pb-20 min-w-0"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-2xl md:text-4xl font-black tracking-tight text-foreground truncate">Business Settings</h2>
          <p className="text-muted-foreground text-base md:text-lg mt-1">Configure your marketplace presence and payouts.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
           <Badge variant="outline" className={cn(
             "px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px]",
             profile?.verificationStatus === "APPROVED" ? "bg-success/10 text-success border-success/20" : "bg-warning/10 text-warning border-warning/20"
           )}>
             {profile?.verificationStatus || "PENDING"}
           </Badge>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 md:gap-8 min-w-0">
        {/* Mobile/Tablet Horizontal Navigation */}
        <div className="xl:hidden overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
           <div className="flex items-center gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
           </div>
        </div>

        {/* Desktop Navigation Sidebar */}
        <Card className="hidden xl:block w-72 border border-border shadow-sm h-fit shrink-0 rounded-[2.5rem] p-4 bg-card/50 backdrop-blur-xl sticky top-32">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="min-w-0"
            >
              {activeTab === "business" && <BusinessTab profile={profile} onUpdate={fetchProfile} />}
              {activeTab === "account" && <AccountTab user={profile?.user} onUpdate={fetchProfile} />}
              {activeTab === "verification" && <VerificationTab documents={profile?.vendordocument} onUpdate={fetchProfile} />}
              {activeTab === "billing" && <BillingTab profile={profile} onUpdate={fetchProfile} />}
              {activeTab === "security" && <SecurityTab sessions={sessions} onRevoke={handleRevokeSession} onRevokeOthers={handleRevokeOthers} revokingId={revokingSession} user={profile?.user} onUpdate={fetchProfile} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// --- Sub-components ---

function BusinessTab({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(vendorProfileSchema.partial().extend({
        businessName: z.string().min(3),
        description: z.string().min(20),
        city: z.string().min(2),
        address: z.string().min(5),
    })),
    defaultValues: {
      businessName: profile?.businessName || "",
      description: profile?.description || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      zipCode: profile?.zipCode || "",
      gstNumber: profile?.gstNumber || "",
      serviceRadius: profile?.serviceRadius || 50,
      logo: profile?.logo || "",
      coverImage: profile?.coverImage || "",
      businessType: profile?.businessType || "Individual",
      categoryId: profile?.categoryId || "",
      subcategoryIds: profile?.service?.map((s: any) => s.serviceTypeId) || [],
      panNumber: profile?.panNumber || "",
      aadhaarNumber: profile?.aadhaarNumber || "",
      bankDetails: profile?.bankDetails || { bankName: '', accountNumber: '', ifscCode: '', upiId: '' },
      website: profile?.website || "",
      socialLinks: profile?.socialLinks || { instagram: "", facebook: "", twitter: "" },
      publicVisibility: profile?.publicVisibility ?? true,
      workingHours: profile?.workingHours || {
        monday: { open: "09:00", close: "18:00" },
        tuesday: { open: "09:00", close: "18:00" },
        wednesday: { open: "09:00", close: "18:00" },
        thursday: { open: "09:00", close: "18:00" },
        friday: { open: "09:00", close: "18:00" },
        saturday: { open: "10:00", close: "16:00" },
        sunday: { open: "00:00", close: "00:00" }
      }
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      const payload = { ...profile, ...data };
      await vendorService.updateProfile(payload);
      toast.success("Business profile updated!");
      onUpdate();
      reset(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const { url } = await vendorService.uploadMedia(file);
      await vendorService.updateLogo(url);
      toast.success("Logo uploaded!");
      onUpdate();
    } catch {
      toast.error("Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] overflow-hidden bg-card min-w-0">
      <CardHeader className="bg-muted/30 p-6 sm:p-8 xl:pb-12 xl:pt-8 border-b border-border/50">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl sm:rounded-[2.5rem] bg-card flex items-center justify-center border-4 border-card shadow-2xl overflow-hidden relative">
               {profile?.logo ? (
                 <Image src={profile.logo} alt="Logo" fill className="object-cover" />
               ) : (
                 <div className="flex flex-col items-center text-primary/20">
                    <Store className="h-8 w-8 sm:h-12 sm:w-12" />
                    <span className="text-[8px] font-black uppercase mt-1">No Logo</span>
                 </div>
               )}
               {uploadingLogo && (
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                 </div>
               )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform z-10"
              title="Upload Logo"
            >
              <Camera className="h-4 w-4" />
            </button>
            {profile?.logo && (
              <button
                onClick={async () => {
                   if (confirm("Delete logo?")) {
                      await vendorService.deleteLogo();
                      onUpdate();
                      toast.success("Logo deleted");
                   }
                }}
                className="absolute -top-1 -right-1 p-2 bg-destructive text-white rounded-xl shadow-lg hover:scale-110 transition-transform z-10"
                title="Delete Logo"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
          </div>
          <div className="text-center sm:text-left space-y-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xl sm:text-3xl font-black text-foreground truncate">{profile?.businessName || "Your Business"}</h3>
              {profile?.verificationStatus === "APPROVED" && <BadgeCheck className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />}
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm font-bold tracking-tight">Vendor ID: <span className="text-foreground">{profile?.id?.slice(-8).toUpperCase()}</span></p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
               <div className="text-center">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground">Rating</p>
                  <p className="font-black text-foreground">{profile?.rating || "0.0"}</p>
               </div>
               <div className="h-8 w-px bg-border" />
               <div className="text-center">
                  <p className="text-[8px] sm:text-[10px] font-black uppercase text-muted-foreground">Bookings</p>
                  <p className="font-black text-foreground">{profile?.totalBookings || 0}</p>
               </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8 xl:pt-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 xl:gap-8">
            <div className="space-y-2 xl:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Name</Label>
                {errors.businessName && <span className="text-[10px] text-destructive font-bold">{errors.businessName.message as string}</span>}
              </div>
              <Input
                {...register("businessName")}
                placeholder="Elite Events & Catering"
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 focus:bg-card transition-all font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Business Type</Label>
              <select
                {...register("businessType")}
                className="w-full h-12 sm:h-14 rounded-2xl border-border bg-muted/30 focus:bg-card transition-all font-bold px-4 sm:px-6 appearance-none outline-none"
              >
                <option value="Individual">Individual</option>
                <option value="Private Limited">Private Limited</option>
                <option value="Partnership">Partnership</option>
                <option value="Proprietorship">Proprietorship</option>
              </select>
            </div>

            <div className="space-y-2 xl:col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">About Your Business</Label>
                {errors.description && <span className="text-[10px] text-destructive font-bold">{errors.description.message as string}</span>}
              </div>
              <Textarea
                {...register("description")}
                placeholder="Describe your services, experience and what makes you unique..."
                className="rounded-2xl border-border bg-muted/30 min-h-[150px] focus:bg-card transition-all font-medium p-4 sm:p-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">GST Number (Optional)</Label>
              <Input
                {...register("gstNumber")}
                placeholder="22AAAAA0000A1Z5"
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">PAN Number</Label>
              <Input
                {...register("panNumber")}
                placeholder="ABCDE1234F"
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6 uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Aadhaar Number</Label>
              <Input
                {...register("aadhaarNumber")}
                placeholder="1234 5678 9012"
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service Radius (km)</Label>
              <Input
                type="number"
                {...register("serviceRadius", { valueAsNumber: true })}
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2 xl:col-span-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Complete Address</Label>
              <Input
                {...register("address")}
                placeholder="Building, Street Name, Area"
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">City</Label>
              <Input
                {...register("city")}
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pincode</Label>
              <Input
                {...register("zipCode")}
                maxLength={6}
                className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-4 sm:px-6"
              />
            </div>

            <div className="space-y-2 xl:col-span-2 pt-4">
               <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Digital Presence</Label>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                     <Globe className="absolute left-4 top-4 h-4 w-4 text-muted-foreground" />
                     <Input {...register("website")} placeholder="Website URL" className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold pl-12 pr-6" />
                  </div>
                  <div className="relative flex items-center bg-muted/30 rounded-2xl border border-border group focus-within:ring-2 focus-within:ring-primary/20 overflow-hidden">
                     <span className="pl-4 sm:pl-6 pr-2 text-[10px] sm:text-xs font-bold text-muted-foreground shrink-0">instagram.com/</span>
                     <Input {...register("socialLinks.instagram")} placeholder="handle" className="h-12 sm:h-14 bg-transparent border-none focus-visible:ring-0 font-bold px-0 flex-1 min-w-0" />
                  </div>
               </div>
            </div>

            <div className="space-y-4 xl:col-span-2">
               <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Operating Hours</Label>
               </div>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4 p-4 sm:p-6 rounded-3xl bg-muted/20 border border-border">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                       <span className="text-xs font-bold capitalize w-20 shrink-0">{day.slice(0, 3)}</span>
                       <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Input {...register(`workingHours.${day}.open` as any)} type="time" className="h-10 rounded-xl border-border bg-card font-bold text-xs flex-1" />
                          <span className="text-[10px] font-bold text-muted-foreground shrink-0">to</span>
                          <Input {...register(`workingHours.${day}.close` as any)} type="time" className="h-10 rounded-xl border-border bg-card font-bold text-xs flex-1" />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="space-y-2 xl:col-span-2">
               <div className="flex items-center justify-between p-4 sm:p-6 rounded-3xl bg-primary/5 border border-primary/10">
                  <div className="min-w-0">
                     <h4 className="font-bold text-foreground text-sm sm:text-base">Marketplace Visibility</h4>
                     <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Toggle profile visibility in search results.</p>
                  </div>
                  <Switch
                    checked={watch("publicVisibility")}
                    onCheckedChange={(val) => reset({ ...watch(), publicVisibility: val }, { keepDirty: true })}
                    className="shrink-0"
                  />
               </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="flex items-center gap-2">
                {isDirty && <Badge className="bg-warning/10 text-warning border-warning/20">Unsaved Changes</Badge>}
             </div>
             <Button
               type="submit"
               disabled={saving || !isDirty}
               className="w-full sm:w-auto rounded-2xl gap-3 font-black px-10 h-12 sm:h-14 bg-cta hover:bg-cta/90 text-white bg-primary text-primary-foreground shadow-xl shadow-cta/20 transition-all uppercase tracking-widest text-[10px] sm:text-xs"
             >
               {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
               Update Business Profile
             </Button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 pt-12 mt-12 border-t border-border/50">
           <div className="p-6 rounded-3xl bg-card border border-border text-center group hover:border-primary/50 transition-all">
              <Briefcase className="h-6 w-6 text-primary mx-auto mb-3" />
              <h4 className="font-bold text-sm">Portfolio</h4>
              <p className="text-[10px] text-muted-foreground mb-4 uppercase font-black">Showcase your work</p>
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
                 <Link href="/vendor/portfolio">Manage Items</Link>
              </Button>
           </div>
           <div className="p-6 rounded-3xl bg-card border border-border text-center group hover:border-primary/50 transition-all">
              <FileText className="h-6 w-6 text-primary mx-auto mb-3" />
              <h4 className="font-bold text-sm">Packages</h4>
              <p className="text-[10px] text-muted-foreground mb-4 uppercase font-black">Pricing & Services</p>
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
                 <Link href="/vendor/services">Edit Services</Link>
              </Button>
           </div>
           <div className="p-6 rounded-3xl bg-card border border-border text-center group hover:border-primary/50 transition-all sm:col-span-2 xl:col-span-1">
              <Globe className="h-6 w-6 text-success mx-auto mb-3" />
              <h4 className="font-bold text-sm">Live Store</h4>
              <p className="text-[10px] text-muted-foreground mb-4 uppercase font-black">View as customer</p>
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
                 <a href={`/marketplace/vendor/${profile?.id}`} target="_blank" rel="noreferrer">Open Page</a>
              </Button>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AccountTab({ user, onUpdate }: { user: any, onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      fullName: user?.fullName || "",
      mobileNumber: user?.mobileNumber || "",
      email: user?.email || "",
      language: user?.language || "en",
      timezone: user?.timezone || "UTC"
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      await vendorService.updateAccount(data);
      toast.success("Account updated!");
      onUpdate();
      reset(data);
    } catch {
      toast.error("Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black">Account Admin</CardTitle>
        <p className="text-muted-foreground text-xs sm:text-sm font-medium">Manage your personal and contact information.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-8">
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                  <Input {...register("fullName")} className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address (Primary)</Label>
                  <Input {...register("email")} disabled className="h-12 sm:h-14 rounded-2xl border-border bg-muted/10 text-muted-foreground font-bold px-6 cursor-not-allowed" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</Label>
                  <Input {...register("mobileNumber")} className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Language</Label>
                  <select {...register("language")} className="w-full h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6 appearance-none">
                     <option value="en">English (Global)</option>
                     <option value="hi">Hindi (India)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Timezone</Label>
                  <select {...register("timezone")} className="w-full h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6 appearance-none">
                     <option value="IST">Asia/Kolkata (IST)</option>
                     <option value="UTC">UTC</option>
                  </select>
               </div>
            </div>
            <div className="flex justify-end pt-4">
               <Button type="submit" disabled={saving || !isDirty} className="w-full sm:w-auto rounded-2xl gap-2 font-black px-10 h-12 sm:h-14 bg-slate-900 text-white shadow-xl shadow-slate-200 uppercase tracking-widest text-[10px] sm:text-xs">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Account Details
               </Button>
            </div>
         </form>

         <div className="p-4 sm:p-6 rounded-3xl bg-warning/5 border border-warning/10 flex gap-4">
            <AlertCircle className="h-6 w-6 text-warning shrink-0" />
            <div>
               <h4 className="font-bold text-warning text-sm sm:text-base">Security Note</h4>
               <p className="text-[10px] sm:text-sm text-muted-foreground mt-1">
                 Email changes require verification from our support team. Please contact admin if you need to update your registered email address.
               </p>
            </div>
         </div>
      </CardContent>
    </Card>
  );
}

function VerificationTab({ documents, onUpdate }: { documents: any[], onUpdate: () => void }) {
  const [uploading, setUploading] = useState<string | null>(null);

  const docTypes = [
    { key: "AADHAAR", label: "Aadhaar Card", icon: User },
    { key: "PAN", label: "PAN Card", icon: CreditCard },
    { key: "GST", label: "GST Certificate", icon: FileText },
    { key: "BUSINESS_LICENSE", label: "Trade/Business License", icon: Briefcase }
  ];

  const handleUpload = async (type: string, file: File) => {
    try {
      setUploading(type);
      const { url } = await vendorService.uploadMedia(file);
      await vendorService.uploadVerificationDoc({ type, url });
      toast.success(`${type} uploaded for verification`);
      onUpdate();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black">Trust & Verification</CardTitle>
        <p className="text-muted-foreground text-xs sm:text-sm font-medium">Verify your business to unlock premium marketplace features.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-8">
         <div className="grid gap-4">
            {docTypes.map((doc) => {
              const existing = documents?.find(d => d.type === doc.key);
              return (
                <div key={doc.key} className="flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 rounded-3xl bg-muted/30 border border-border gap-4">
                   <div className="flex items-center gap-4 sm:gap-5 w-full md:w-auto">
                      <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-card flex items-center justify-center border border-border shadow-sm shrink-0">
                         <doc.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      </div>
                      <div className="min-w-0">
                         <p className="font-extrabold text-foreground text-sm sm:text-base truncate">{doc.label}</p>
                         <div className="flex items-center gap-2 mt-0.5">
                            {existing ? (
                              <Badge className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                existing.status === "APPROVED" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                              )}>
                                {existing.status}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Not Uploaded</Badge>
                            )}
                         </div>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 w-full md:w-auto">
                      {existing && (
                        <Button variant="ghost" size="sm" asChild className="flex-1 md:flex-none rounded-xl font-bold h-10 px-4">
                          <a href={existing.url} target="_blank" rel="noreferrer">Preview</a>
                        </Button>
                      )}
                      <div className="relative flex-1 md:flex-none">
                        <Button
                          disabled={uploading === doc.key}
                          className="w-full rounded-xl gap-2 font-black h-10 px-6 bg-primary text-white text-[10px] sm:text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
                          onClick={() => document.getElementById(`upload-${doc.key}`)?.click()}
                        >
                          {uploading === doc.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-3 w-3" />}
                          {existing ? "Replace" : "Upload"}
                        </Button>
                        <input
                          id={`upload-${doc.key}`}
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleUpload(doc.key, e.target.files[0])}
                          accept="image/*,application/pdf"
                        />
                      </div>
                   </div>
                </div>
              );
            })}
         </div>
      </CardContent>
    </Card>
  );
}

function BillingTab({ profile, onUpdate }: { profile: any, onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { isDirty } } = useForm({
    defaultValues: {
      bankName: profile?.bankDetails?.bankName || "",
      accountNumber: profile?.bankDetails?.accountNumber || "",
      ifscCode: profile?.bankDetails?.ifscCode || "",
      upiId: profile?.bankDetails?.upiId || ""
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setSaving(true);
      await vendorService.updatePayouts(data);
      toast.success("Bank details saved!");
      onUpdate();
      reset(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save bank details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-black">Payout Settings</CardTitle>
        <p className="text-muted-foreground text-xs sm:text-sm font-medium">Configure where you receive your earnings.</p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 md:p-8 space-y-8">
         <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bank Name</Label>
                  <Input {...register("bankName")} placeholder="HDFC BANK" className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Number</Label>
                  <Input {...register("accountNumber")} placeholder="0000 0000 0000 0000" className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">IFSC Code</Label>
                  <Input {...register("ifscCode")} placeholder="HDFC0001234" className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6 uppercase" />
               </div>
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">UPI ID (Optional)</Label>
                  <Input {...register("upiId")} placeholder="username@upi" className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
               </div>
            </div>
            <div className="flex justify-end">
               <Button type="submit" disabled={saving || !isDirty} className="w-full sm:w-auto rounded-2xl gap-3 font-black px-10 h-12 sm:h-14 bg-cta hover:bg-cta/90 text-white bg-primary text-primary-foreground shadow-xl shadow-cta/20 transition-all uppercase tracking-widest text-[10px] sm:text-xs">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Save Bank Details
               </Button>
            </div>
         </form>
      </CardContent>
    </Card>
  );
}

function SecurityTab({ sessions, onRevoke, onRevokeOthers, revokingId, user, onUpdate }: { sessions: any[], onRevoke: (id: string) => void, onRevokeOthers: () => void, revokingId: string | null, user: any, onUpdate: () => void }) {
  const [updatingPass, setUpdatingPass] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  const handlePasswordChange = async (data: any) => {
     if (data.newPassword !== data.confirmPassword) {
       toast.error("Passwords do not match");
       return;
     }
     try {
       setUpdatingPass(true);
       await vendorService.updateSecurity(data);
       toast.success("Password updated!");
       reset();
     } catch (error: any) {
       toast.error(error.response?.data?.message || "Password change failed");
     } finally {
       setUpdatingPass(false);
     }
  };

  const handle2FAToggle = async (enabled: boolean) => {
     try {
        await vendorService.updateSecurity({ twoFactorEnabled: enabled });
        onUpdate();
        toast.success(`2FA ${enabled ? 'enabled' : 'disabled'}`);
     } catch {
        toast.error("Failed to update 2FA");
     }
  };

  return (
    <div className="space-y-6 md:space-y-8 min-w-0">
      <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-xl sm:text-2xl font-black">Change Password</CardTitle>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium">Keep your account secure with a strong password.</p>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 md:p-8">
           <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-6">
              <div className="grid gap-4 md:gap-6 max-w-xl">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Current Password</Label>
                    <Input type="password" {...register("currentPassword")} className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                       <Input type="password" {...register("newPassword")} className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                       <Input type="password" {...register("confirmPassword")} className="h-12 sm:h-14 rounded-2xl border-border bg-muted/30 font-bold px-6" />
                    </div>
                 </div>
                 <Button type="submit" disabled={updatingPass} className="w-full sm:w-fit rounded-2xl gap-2 font-black px-10 h-12 sm:h-14 bg-primary text-white shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] sm:text-xs">
                    {updatingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Update Password
                 </Button>
              </div>
           </form>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl font-black">Active Sessions</CardTitle>
            <p className="text-muted-foreground text-xs sm:text-sm font-medium">Devices currently logged into your account.</p>
          </div>
          <Button variant="outline" size="sm" onClick={onRevokeOthers} className="w-full sm:w-auto rounded-xl font-bold border-destructive/20 text-destructive hover:bg-destructive/10 h-10 px-4 whitespace-nowrap">
             Logout Other Devices
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 md:p-8">
           <div className="divide-y divide-border">
              {sessions.map((session) => (
                <div key={session.id} className="py-4 flex items-center justify-between gap-4">
                   <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                         <Smartphone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                         <p className="font-bold text-xs sm:text-sm text-foreground truncate">Session ID: {session.id.slice(0, 8)}</p>
                         <p className="text-[8px] sm:text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">Started: {new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                   </div>
                   <Button
                     variant="ghost"
                     size="icon"
                     disabled={revokingId === session.id}
                     onClick={() => onRevoke(session.id)}
                     className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl shrink-0"
                   >
                     {revokingId === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                   </Button>
                </div>
              ))}
              {sessions.length === 0 && <p className="py-8 text-center text-muted-foreground font-medium">No active sessions found.</p>}
           </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm rounded-2xl sm:rounded-3xl xl:rounded-[2.5rem] bg-secondary/5 overflow-hidden">
         <CardContent className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
               <div className="flex gap-4 min-w-0">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                     <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0">
                     <h4 className="font-extrabold text-foreground text-sm sm:text-base">Two-Factor Authentication</h4>
                     <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Add an extra layer of security to your account.</p>
                  </div>
               </div>
               <Switch
                 checked={user?.twoFactorEnabled || false}
                 onCheckedChange={handle2FAToggle}
                 className="data-[state=checked]:bg-primary shrink-0"
               />
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
