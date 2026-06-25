"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Image as ImageIcon, Video, Upload, Grid3X3, Film, Search, MoreVertical, ExternalLink } from "lucide-react";
import axios from "axios";
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
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function VendorPortfolio() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState("ALL"); // ALL, IMAGE, VIDEO
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    title: "",
    description: "",
    mediaUrl: "",
    mediaType: "IMAGE",
    serviceId: "",
  });

  const [services, setServices] = useState<any[]>([]);

  const fetchPortfolio = async () => {
    try {
      const [portfolioRes, servicesRes] = await Promise.all([
        axios.get("/api/vendor/portfolio", {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        axios.get("/api/vendor/services", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
      ]);
      setPortfolio(portfolioRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to fetch data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) fetchPortfolio();
  }, [accessToken]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await axios.delete(`/api/vendor/portfolio/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast({ title: "Success", description: "Item deleted" });
      fetchPortfolio();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Delete failed" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data"
        },
      });
      setNewItem({ ...newItem, mediaUrl: res.data.secure_url, mediaType: file.type.startsWith("video") ? "VIDEO" : "IMAGE" });
      toast({ title: "Success", description: "File uploaded successfully" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.mediaUrl) return toast({ variant: "destructive", title: "Error", description: "Please upload a file first" });

    try {
      await axios.post("/api/vendor/portfolio", newItem, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      toast({ title: "Success", description: "Portfolio item added" });
      fetchPortfolio();
      setNewItem({ title: "", description: "", mediaUrl: "", mediaType: "IMAGE", serviceId: "" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add portfolio item" });
    }
  };

  const filteredPortfolio = portfolio.filter(item => filter === "ALL" || item.mediaType === filter);

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Portfolio Manager</h2>
          <p className="text-muted-foreground text-lg mt-1">Showcase your brand with high-quality visual storytelling.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-2xl gap-2 font-black px-8 bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all h-14">
              <Plus className="h-5 w-5" /> Add New Work
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-border bg-card shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-foreground">Add Portfolio Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
                <Input
                  className="rounded-xl h-12 bg-muted/50 border-border font-bold focus:ring-primary/20"
                  placeholder="e.g. Grand Wedding Decor"
                  value={newItem.title}
                  onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Link to Service (Optional)</Label>
                <select
                  className="w-full bg-muted/50 border border-border rounded-xl h-12 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  value={newItem.serviceId}
                  onChange={(e) => setNewItem({...newItem, serviceId: e.target.value})}
                >
                  <option value="">General Portfolio</option>
                  {services.map(service => (
                    <option key={service.id} value={service.id}>{service.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Upload Media</Label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl p-8 hover:bg-muted/50 cursor-pointer relative transition-colors group">
                    <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        accept="image/*,video/*"
                    />
                    {uploading ? (
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                            <p className="text-sm font-bold text-foreground">Uploading to Cloud...</p>
                        </div>
                    ) : newItem.mediaUrl ? (
                        <div className="text-center">
                             {newItem.mediaType === "IMAGE" ? (
                                <img src={newItem.mediaUrl} alt="Preview" className="h-40 w-auto mx-auto rounded-xl shadow-lg border border-border" />
                             ) : (
                                <div className="h-40 w-64 bg-secondary rounded-xl flex items-center justify-center mx-auto border border-border">
                                    <Film className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                             )}
                             <p className="text-xs text-success font-black mt-4 uppercase tracking-widest">Upload Complete!</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-primary/10 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-sm font-black text-foreground">Click or drag to upload</p>
                            <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest">Images or Videos (Max 10MB)</p>
                        </>
                    )}
                </div>
              </div>
              <Button size="lg" className="w-full rounded-2xl h-14 font-black mt-4 bg-primary text-primary-foreground" onClick={handleAddItem} disabled={uploading}>
                Publish to Portfolio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-2xl w-fit border border-border">
            {[
                { id: "ALL", label: "All Work", icon: Grid3X3 },
                { id: "IMAGE", label: "Photos", icon: ImageIcon },
                { id: "VIDEO", label: "Videos", icon: Film },
            ].map((t) => (
                <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    className={cn(
                        "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative",
                        filter === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {filter === t.id && (
                        <motion.div layoutId="port-filter" className="absolute inset-0 bg-card shadow-sm rounded-xl" />
                    )}
                    <t.icon className="h-4 w-4 relative z-10" />
                    <span className="relative z-10">{t.label}</span>
                </button>
            ))}
        </div>
        <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              placeholder="Search portfolio..."
              className="pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-2xl text-sm w-64 font-bold focus:bg-card focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
        {loading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <Skeleton key={i} className="aspect-[4/5] rounded-[2.5rem]" />
          ))
        ) : filteredPortfolio.length > 0 ? (
          filteredPortfolio.map((item, i) => (
            <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.05 }}
                className="group relative aspect-[4/5] bg-card rounded-[2.5rem] overflow-hidden border border-border hover:border-primary/40 transition-all shadow-sm hover:shadow-2xl"
            >
              {item.mediaType === "IMAGE" ? (
                <Image
                  src={item.mediaUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800"}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                  priority={i < 4}
                />
              ) : (
                <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                        <Film className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                    {/* Real video tag if possible, or just a play icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full bg-card/20 backdrop-blur-md border border-white/20 flex items-center justify-center group-hover:scale-125 transition-transform">
                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                        </div>
                    </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="absolute top-6 right-6 flex gap-2">
                    <button className="h-10 w-10 rounded-xl bg-card/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-card/20 transition-colors">
                        <ExternalLink className="h-4 w-4 text-white" />
                    </button>
                    <button
                        className="h-10 w-10 rounded-xl bg-destructive/20 backdrop-blur-md border border-destructive/40 flex items-center justify-center hover:bg-destructive transition-colors group/del"
                        onClick={() => handleDelete(item.id)}
                    >
                        <Trash2 className="h-4 w-4 text-white" />
                    </button>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-primary text-[8px] font-black text-primary-foreground uppercase tracking-widest">
                            {item.mediaType}
                        </span>
                        {item.service && (
                            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{item.service.title}</span>
                        )}
                    </div>
                    <h3 className="text-white text-xl font-black leading-tight group-hover:translate-y-0 translate-y-2 transition-transform">{item.title || "Untitled Work"}</h3>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-32 border-2 border-dashed border-border rounded-[3rem] bg-muted/30">
            <div className="bg-card h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-border">
                <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
            </div>
            <h3 className="text-3xl font-black mb-3 text-foreground">Your portfolio is empty</h3>
            <p className="text-muted-foreground max-w-sm mx-auto font-bold mb-10 leading-relaxed">Let's show the world what you can do. Upload your first high-quality work to attract more clients.</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="lg" className="rounded-2xl px-12 font-black h-16 bg-primary text-primary-foreground shadow-xl shadow-primary/20">
                        <Plus className="h-6 w-6 mr-2" /> Start Your Showcase
                    </Button>
                </DialogTrigger>
            </Dialog>
          </div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
