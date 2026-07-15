"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Map as MapIcon,
    Search,
    Calendar,
    ArrowUpRight,
    Users,
    Zap,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import apiClient from "@/lib/apiClient";
import { toast } from "react-hot-toast";

export default function AdminAnalytics() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await apiClient.get("/admin/analytics/search");
                setData(response.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load analytics");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 pb-20 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight">Intelligence Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Real-time search demand, trend analysis, and market heatmaps.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-card border border-border/50 px-6 py-3 rounded-2xl flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="font-bold">Last 30 Days</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="rounded-3xl border-none shadow-sm overflow-hidden group">
                    <CardHeader className="bg-primary text-white pb-8">
                        <div className="flex justify-between items-center">
                            <TrendingUp className="h-6 w-6 opacity-80" />
                            <span className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-lg uppercase tracking-widest">Growth</span>
                        </div>
                        <p className="text-sm font-bold opacity-80 mt-4">Top Trending Query</p>
                        <h3 className="text-2xl font-black capitalize mt-1">{data?.trending[0] || "No Data"}</h3>
                    </CardHeader>
                </Card>

                <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <Zap className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">High Demand Category</p>
                        </div>
                        <h3 className="text-3xl font-black">{data?.summary[0]?.category || "N/A"}</h3>
                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-black mt-2">
                            <ArrowUpRight className="h-3 w-3" />
                            <span>12% Increase</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Search className="h-5 w-5 text-indigo-500" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Total Analyzed Queries</p>
                        </div>
                        <h3 className="text-3xl font-black">{data?.heatmap?.length || 0}</h3>
                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">Active Search Areas</p>
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-rose-500/10 rounded-2xl">
                                <Users className="h-5 w-5 text-rose-500" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Market Saturation</p>
                        </div>
                        <h3 className="text-3xl font-black">Moderate</h3>
                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">Supply vs Demand</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="demand" className="w-full">
                <TabsList className="bg-secondary/50 p-1 rounded-2xl mb-8">
                    <TabsTrigger value="demand" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Demand Heatmap</TabsTrigger>
                    <TabsTrigger value="trends" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Search Trends</TabsTrigger>
                    <TabsTrigger value="categories" className="rounded-xl px-8 font-bold data-[state=active]:bg-primary data-[state=active]:text-white">Category Analysis</TabsTrigger>
                </TabsList>

                <TabsContent value="demand" className="mt-0">
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <Card className="rounded-[2.5rem] border-none shadow-xl h-[600px] flex items-center justify-center bg-secondary/20 overflow-hidden relative">
                                <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/78.9629,20.5937,4,0/800x600?access_token=DUMMY')] bg-cover opacity-50 grayscale" />
                                <div className="z-10 text-center p-12 bg-white/80 backdrop-blur-md rounded-3xl border border-white/50 shadow-2xl">
                                    <MapIcon className="h-12 w-12 text-primary mx-auto mb-4 opacity-20" />
                                    <h3 className="text-2xl font-black mb-2">Interactive Heatmap</h3>
                                    <p className="text-muted-foreground font-bold">Visualizing {data?.heatmap?.length} search clusters across the country.</p>
                                    <div className="mt-6 flex gap-2 justify-center">
                                        <div className="flex items-center gap-2 bg-rose-500/10 px-4 py-2 rounded-xl">
                                            <div className="h-3 w-3 rounded-full bg-rose-500" />
                                            <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">High Demand</span>
                                        </div>
                                        <div className="flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-xl">
                                            <div className="h-3 w-3 rounded-full bg-amber-500" />
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Growing</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="space-y-6">
                            <Card className="rounded-[2.5rem] border-border/50 shadow-sm overflow-hidden">
                                <CardHeader className="border-b border-border/50 bg-secondary/10">
                                    <CardTitle className="text-lg font-black">Top Search Query Clusters</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {data?.trending.map((term: string, i: number) => (
                                            <div key={term} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <span className="h-8 w-8 rounded-xl bg-white flex items-center justify-center font-black text-xs shadow-sm">{i + 1}</span>
                                                    <span className="font-bold capitalize">{term}</span>
                                                </div>
                                                <div className="h-2 w-24 bg-primary/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary" style={{ width: `${100 - (i * 10)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="trends">
                    <Card className="rounded-[2.5rem] border-none shadow-xl bg-white p-12 text-center">
                         <BarChart3 className="h-16 w-16 text-primary/20 mx-auto mb-6" />
                         <h2 className="text-3xl font-black mb-4">Market Velocity Trends</h2>
                         <p className="text-muted-foreground font-bold max-w-md mx-auto">Temporal analysis of search volumes to identify seasonal peaks for various event services.</p>
                    </Card>
                </TabsContent>

                <TabsContent value="categories">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data?.summary.map((cat: any) => (
                            <Card key={cat.category} className="rounded-3xl border-border/50 p-6 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">{cat.category || "General"}</h4>
                                    <p className="text-2xl font-black">{cat._count._all} Queries</p>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <Zap className="h-6 w-6 text-primary" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
