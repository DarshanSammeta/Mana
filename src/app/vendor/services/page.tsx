"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Package,
  Store,
  Image as ImageIcon,
  ChevronRight,
  Star,
  ArrowRight,
  Search,
  Filter,
  ExternalLink,
  MoreVertical,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";

export default function VendorServices() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchServices = async () => {
    try {
      const [servicesRes, categoriesRes] = await Promise.all([
        axios.get("/api/vendor/services", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("/api/categories")
      ]);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchServices();
  }, [accessToken]);

  const [newService, setNewService] = useState({
    title: "",
    description: "",
    basePrice: "",
    pricingType: "PACKAGE",
    categoryId: "",
    subcategoryId: "",
    serviceTypeId: "",
  });

  const handleAddService = async () => {
    try {
      setLoading(true);
      await axios.post("/api/vendor/services", newService, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast({ title: "Success", description: "Service added successfully" });
      fetchServices();
      setNewService({ title: "", description: "", basePrice: "", pricingType: "PACKAGE", categoryId: "", subcategoryId: "", serviceTypeId: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add service" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure? This will delete all packages under this service.")) return;
    try {
      await axios.delete(`/api/vendor/services/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast({ title: "Success", description: "Service deleted" });
      fetchServices();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Your Services</h1>
          <p className="text-muted-foreground mt-1">Add, edit, or remove services from your marketplace storefront.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/20 flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add New Service
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-6 border-border bg-card">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold border-b border-border pb-4">Create New Service Listing</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Title</Label>
                <Input
                  className="rounded-xl border-border bg-muted/50 text-sm h-11 focus:ring-primary/20"
                  placeholder="e.g. Wedding Photography Essentials"
                  value={newService.title}
                  onChange={(e) => setNewService({...newService, title: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</Label>
                <Textarea
                  className="rounded-xl border-border bg-muted/50 text-sm min-h-[100px] focus:ring-primary/20"
                  placeholder="Describe what's included in this service..."
                  value={newService.description}
                  onChange={(e) => setNewService({...newService, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</Label>
                    <select
                        className="w-full bg-muted/50 border border-border rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        value={newService.categoryId}
                        onChange={(e) => {
                          const catId = e.target.value;
                          setNewService({...newService, categoryId: catId, subcategoryId: "", serviceTypeId: ""});
                        }}
                    >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Type</Label>
                    <select
                        className="w-full bg-muted/50 border border-border rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                        value={newService.serviceTypeId}
                        onChange={(e) => setNewService({...newService, serviceTypeId: e.target.value})}
                        disabled={!newService.categoryId}
                    >
                        <option value="">Select Type</option>
                        {categories.find(c => c.id === newService.categoryId)?.subcategory?.flatMap((sub: any) => sub.servicetype).map((st: any) => (
                            <option key={st.id} value={st.id}>{st.name}</option>
                        ))}
                    </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Base Price (₹)</Label>
                <Input
                  className="rounded-xl border-border bg-muted/50 text-sm h-11 focus:ring-primary/20"
                  type="number"
                  placeholder="5000"
                  value={newService.basePrice}
                  onChange={(e) => setNewService({...newService, basePrice: e.target.value})}
                />
              </div>
              <Button
                className="w-full h-11 bg-cta text-white rounded-xl text-sm font-bold shadow-lg hover:bg-cta/90 mt-2"
                onClick={handleAddService}
                isLoading={loading}
              >
                Create Listing
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-card p-5 border border-border rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Listings</p>
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
            </div>
        </div>
        <div className="bg-card p-5 border border-border rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <Package className="h-6 w-6 text-success" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Packages</p>
                <p className="text-2xl font-bold text-foreground">{services.reduce((acc: number, s: any) => acc + (s.packages?.length || 0), 0)}</p>
            </div>
        </div>
        <div className="bg-card p-5 border border-border rounded-2xl shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-cta/10 flex items-center justify-center border border-cta/20">
                <Star className="h-6 w-6 text-cta" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg. Rating</p>
                <p className="text-2xl font-bold text-foreground">4.8</p>
            </div>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="bg-card p-4 border border-border rounded-2xl shadow-sm flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
                placeholder="Search services..."
                className="pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card transition-all"
            />
        </div>
        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">
                <Filter className="h-4 w-4" /> Filter
            </button>
            <select className="px-4 py-2 border border-border rounded-xl text-sm font-semibold bg-card outline-none focus:ring-2 focus:ring-primary/20">
                <option>Sort by: Newest</option>
                <option>Sort by: Price High-Low</option>
                <option>Sort by: Price Low-High</option>
            </select>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {loading ? (
          [1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl border" />)
        ) : services.length > 0 ? (
          services.map((service) => (
            <div key={service.id} className="bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-all flex flex-col md:flex-row group overflow-hidden">
                <div className="w-full md:w-56 h-48 md:h-auto bg-muted relative shrink-0">
                    <ImageIcon className="absolute inset-0 m-auto h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-card/90 backdrop-blur-sm border border-border rounded-lg text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm">
                        {service.category?.name || "Service"}
                    </div>
                </div>
                <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer leading-tight">{service.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                                <Layers className="h-3.5 w-3.5" />
                                <span>{service.packages?.length || 0} packages live</span>
                                <span className="text-border">•</span>
                                <div className="flex items-center gap-1 text-success font-bold uppercase text-[10px] tracking-wider">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Active
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 rounded-xl border border-border hover:bg-muted hover:text-primary transition-all"><Edit className="h-4 w-4" /></button>
                            <button
                                className="p-2 rounded-xl border border-border hover:bg-destructive/10 hover:text-destructive transition-all"
                                onClick={() => handleDeleteService(service.id)}
                            ><Trash2 className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 flex-1 mb-5 leading-relaxed">
                        {service.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t border-border/50">
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Price</span>
                            <span className="text-2xl font-bold text-foreground">₹{service.basePrice}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href={`/vendor/services/${service.id}/packages`}>
                                <button className="px-5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                                    <Package className="h-4 w-4" /> Manage Packages
                                </button>
                            </Link>
                            <button className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Store}
            title="No Services Listed"
            description="Start by adding your first service to show up in the marketplace search results."
            actionText="Create Your First Service"
            onActionClick={() => setIsDialogOpen(true)}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
            <h4 className="text-sm font-bold text-primary">Listing Optimization Tip</h4>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Services with more than 3 high-quality images and clear package pricing receive 45% more booking inquiries.
                <button className="text-primary font-bold hover:underline ml-1 inline-flex items-center gap-1">
                    Learn how to optimize <ArrowRight className="h-3.5 w-3.5" />
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}
