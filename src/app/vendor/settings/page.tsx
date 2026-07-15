"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
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
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { vendorService } from "@/services/client";
import { toast } from "react-hot-toast";

export default function VendorSettings() {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("business");
  const [profile, setProfile] = useState<any>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await vendorService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveBankDetails = async () => {
    setSaving(true);
    try {
      await vendorService.updateProfile({ bankDetails: profile.bankDetails });
      toast.success("Bank details updated successfully!");
      fetchProfile();
    } catch (error: any) {
      console.error("Save Error:", error);
      toast.error(error.response?.data?.message || "Failed to update bank details");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      await vendorService.updateProfile({
        businessName: profile.businessName,
        description: profile.description,
        gstNumber: profile.gstNumber,
        city: profile.city
      });
      toast.success("Profile updated successfully!");
      fetchProfile();
    } catch (error: any) {
      console.error("Update Error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const tabs = [
    { id: "business", label: "Business Profile", icon: Store },
    { id: "account", label: "Account Admin", icon: User },
    { id: "verification", label: "Verification", icon: BadgeCheck },
    { id: "billing", label: "Payouts", icon: CreditCard },
    { id: "security", label: "Security", icon: Lock },
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

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <div>
        <h2 className="text-4xl font-black tracking-tight text-foreground">Business Settings</h2>
        <p className="text-muted-foreground text-lg mt-1">Configure your marketplace presence and payouts.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Navigation Sidebar */}
        <Card className="lg:w-72 border border-border shadow-sm h-fit shrink-0 rounded-[2.5rem] p-4 bg-card">
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "business" && (
            <motion.div variants={itemAnim} className="space-y-6">
              <Card className="border border-border shadow-sm rounded-[2.5rem] overflow-hidden bg-card">
                <CardHeader className="bg-muted/50 pb-12 pt-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="h-28 w-28 rounded-[2.5rem] bg-card flex items-center justify-center border-4 border-card shadow-xl overflow-hidden">
                         {profile?.logo ? (
                           <Image
                             src={profile.logo}
                             alt="Logo"
                             fill
                             className="object-cover"
                           />
                         ) : (
                           <Store className="h-10 w-10 text-primary/40" />
                         )}
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 bg-cta text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                        <Camera className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-2xl font-black text-foreground">{profile?.businessName || "Elite Events & Catering"}</h3>
                        <BadgeCheck className="h-5 w-5 text-primary" />
                      </div>
                      <p className="text-muted-foreground font-medium">Vendor ID: {profile?.id?.slice(-8).toUpperCase() || "VEND-98234"}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Name</Label>
                      <Input
                        value={profile?.businessName || ""}
                        onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                        className="rounded-xl border-border bg-muted/50 font-bold focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About Business</Label>
                      <Textarea
                        placeholder="Tell clients about your services..."
                        className="rounded-xl border-border bg-muted/50 min-h-[120px] focus:ring-primary/20"
                        value={profile?.description || ""}
                        onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">GST Number</Label>
                      <Input
                        value={profile?.gstNumber || ""}
                        onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                        className="rounded-xl border-border bg-muted/50 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">City</Label>
                      <Input
                        value={profile?.city || ""}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="rounded-xl border-border bg-muted/50 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleUpdateProfile}
                      disabled={updatingProfile}
                      className="rounded-2xl gap-2 font-bold px-8 bg-cta text-white hover:bg-cta/90 shadow-lg shadow-cta/20 h-12"
                    >
                      <Save className="h-4 w-4" />
                      {updatingProfile ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-3 gap-6">
                <GlassCard className="p-6 border border-border text-center bg-card shadow-sm" animateHover>
                    <Briefcase className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-foreground">Portfolio</h4>
                    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-wider">{profile?.portfolio?.length || 0} Images Uploaded</p>
                    <Button variant="outline" size="sm" className="w-full rounded-lg h-8 text-xs border-border hover:bg-muted">Manage</Button>
                </GlassCard>

                <GlassCard className="p-6 border border-border text-center bg-card shadow-sm" animateHover>
                    <FileText className="h-6 w-6 text-primary mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-foreground">Service Docs</h4>
                    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-wider">GST & Licenses</p>
                    <Button variant="outline" size="sm" className="w-full rounded-lg h-8 text-xs border-border hover:bg-muted">View</Button>
                </GlassCard>

                <GlassCard className="p-6 border border-border text-center bg-card shadow-sm" animateHover>
                    <Globe className="h-6 w-6 text-success mx-auto mb-2" />
                    <h4 className="font-bold text-sm text-foreground">Visibility</h4>
                    <p className="text-[10px] text-muted-foreground mb-3 font-bold uppercase tracking-wider">Publicly Listed</p>
                    <Button variant="outline" size="sm" className="w-full rounded-lg h-8 text-xs border-border hover:bg-muted">Settings</Button>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === "billing" && (
            <motion.div variants={itemAnim} className="space-y-6">
              <Card className="border border-border shadow-sm rounded-[2.5rem] bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-foreground">Payout Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Holder Name</Label>
                      <Input
                        value={profile?.bankDetails?.accountHolder || ""}
                        onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountHolder: e.target.value } })}
                        className="rounded-xl border-border bg-muted/50 font-bold"
                        placeholder="AS PER BANK RECORDS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account Number</Label>
                      <Input
                        value={profile?.bankDetails?.accountNumber || ""}
                        onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, accountNumber: e.target.value } })}
                        className="rounded-xl border-border bg-muted/50 font-bold"
                        placeholder="ENTER ACCOUNT NUMBER"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Bank Name</Label>
                      <Input
                        value={profile?.bankDetails?.bankName || ""}
                        onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, bankName: e.target.value } })}
                        className="rounded-xl border-border bg-muted/50 font-bold"
                        placeholder="E.G. HDFC BANK"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">IFSC Code</Label>
                      <Input
                        value={profile?.bankDetails?.ifscCode || ""}
                        onChange={(e) => setProfile({ ...profile, bankDetails: { ...profile.bankDetails, ifscCode: e.target.value.toUpperCase() } })}
                        className="rounded-xl border-border bg-muted/50 font-bold"
                        placeholder="HDFC0001234"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSaveBankDetails}
                      disabled={saving}
                      className="rounded-2xl gap-2 font-bold px-8 bg-cta text-white hover:bg-cta/90 shadow-lg shadow-cta/20 h-12"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Bank Details"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm rounded-[2.5rem] bg-secondary/5">
                <CardContent className="pt-6">
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Secure Payouts</h4>
                      <p className="text-sm text-muted-foreground">
                        Your bank details are encrypted and used only for processing your earnings.
                        Payouts are usually processed within 2-3 business days of the request.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeTab === "verification" && (
            <motion.div variants={itemAnim} className="space-y-6">
               <Card className="border border-border shadow-sm rounded-[2.5rem] bg-card">
                <CardHeader>
                  <CardTitle className="text-2xl font-black text-foreground">Trust & Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="p-6 rounded-[2rem] bg-success/5 border border-success/10 flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 rounded-2xl bg-success/10 flex items-center justify-center">
                          <BadgeCheck className="h-8 w-8 text-success" />
                        </div>
                        <div>
                          <p className="font-black text-lg text-foreground">Verified Partner</p>
                          <p className="text-sm text-muted-foreground">Your business is fully verified and prioritized in searches.</p>
                        </div>
                      </div>
                      <span className="bg-success/10 text-success px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-success/20">Active</span>
                   </div>

                   <div className="grid gap-4">
                      <h4 className="font-bold text-foreground">Submitted Documents</h4>
                      {profile?.vendordocument?.length > 0 ? profile.vendordocument.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-card rounded-lg shadow-sm border border-border">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground">{doc.type}</p>
                                <p className="text-[10px] text-muted-foreground font-medium">Status: {doc.status}</p>
                              </div>
                           </div>
                           <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">No documents submitted yet.</p>
                      )}
                   </div>
                </CardContent>
               </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
