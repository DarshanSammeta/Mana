"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Navigation, Map as MapIcon, Loader2, Home, Briefcase, Star, History, Trash2, Edit3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocationStore, SavedAddress, LocationDetails } from "@/store/locationStore";
import { useLocation } from "@/hooks/useLocation";
import { mapsService } from "@/services/maps.service";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

interface LocationSelectorProps {
  trigger?: React.ReactNode;
}

export function LocationSelector({ trigger }: LocationSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const {
    city, locality, address, setLocation, setCity,
    savedAddresses, recentLocations, addRecentLocation,
    removeSavedAddress
  } = useLocationStore();
  const { detectLocation: autoDetect, permissionStatus } = useLocation();
  const { user } = useAuthStore();

  const handleAutoDetect = async () => {
    setIsLocating(true);
    try {
      await autoDetect(true);
    } catch (error) {
      console.error("Auto detection failed:", error);
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const results = await mapsService.getAutocomplete(searchQuery);
          setSuggestions(results || []);
        } catch (error) {
          console.error("Autocomplete failed:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectLocation = async (loc: LocationDetails) => {
    setLocation(loc);
    addRecentLocation(loc);
    setOpen(false);
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    try {
      const coords = await mapsService.geocodeAddress(suggestion.description);
      if (coords) {
        const data = await mapsService.reverseGeocode(coords.lat, coords.lng);
        const addr = data.address;
        const details: LocationDetails = {
          lat: coords.lat,
          lng: coords.lng,
          address: suggestion.description,
          city: addr.city || addr.town || addr.village || addr.state_district || "Unknown City",
          locality: addr.suburb || addr.neighbourhood || addr.residential || addr.locality || "",
          district: addr.state_district || addr.city_district || "",
          state: addr.state || "",
          country: addr.country || "India",
          postalCode: addr.postcode || "",
          source: 'MANUAL'
        };
        handleSelectLocation(details);
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  };

  const getAddressIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'office': return <Briefcase className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-all group">
            <MapPin className="h-5 w-5 text-yellow-400" />
            <div className="text-left leading-tight">
              <p className="text-[10px] uppercase font-black tracking-widest text-white/90">Location</p>
              <p className="text-[14px] font-bold text-white">{locality || city || "Select City"}</p>
            </div>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <DialogHeader className="p-6 bg-[#111827] text-white">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-black flex items-center gap-3">
              <MapIcon className="h-6 w-6 text-yellow-400" />
              Location Engine
            </DialogTitle>
          </div>
          <p className="text-slate-400 text-sm font-medium mt-1">Smart proximity-based vendor discovery</p>
        </DialogHeader>

        <div className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-14 bg-slate-50 border-b border-slate-100 rounded-none p-0">
              <TabsTrigger value="search" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none border-r border-slate-100 font-bold uppercase tracking-widest text-[10px]">
                <Search className="h-4 w-4 mr-2" /> Search
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none border-r border-slate-100 font-bold uppercase tracking-widest text-[10px]">
                <Star className="h-4 w-4 mr-2" /> Saved
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex-1 h-full data-[state=active]:bg-white data-[state=active]:text-blue-600 rounded-none font-bold uppercase tracking-widest text-[10px]">
                <History className="h-4 w-4 mr-2" /> Recent
              </TabsTrigger>
            </TabsList>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <TabsContent value="search" className="mt-0 space-y-6">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    placeholder="Search for area, street or city..."
                    className="pl-12 h-14 bg-slate-50 border-slate-200 rounded-2xl text-base focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 animate-spin" />
                  )}
                </div>

                {suggestions.length > 0 ? (
                  <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Search Results</p>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-blue-50 rounded-2xl transition-all group text-left border border-transparent hover:border-blue-100"
                      >
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-white transition-colors">
                          <MapPin className="h-5 w-5 text-slate-400 group-hover:text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700">{s.structured_formatting?.main_text}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{s.structured_formatting?.secondary_text}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleAutoDetect}
                      disabled={isLocating}
                      className={cn(
                        "w-full h-14 rounded-2xl border-2 font-black gap-3 transition-all group",
                        permissionStatus === 'denied' || permissionStatus === 'blocked'
                          ? "border-red-50 bg-red-50 text-red-600"
                          : "border-blue-50 hover:bg-blue-50 hover:border-blue-100 text-blue-600"
                      )}
                    >
                      {isLocating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Navigation className="h-5 w-5 fill-current group-hover:scale-110 transition-transform" />
                      )}
                      {permissionStatus === 'denied' || permissionStatus === 'blocked'
                        ? "Location Access Blocked"
                        : "Detect My Current Location"}
                    </Button>

                    <div className="space-y-4 pt-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Popular Cities</p>
                      <div className="grid grid-cols-3 gap-2">
                        {POPULAR_CITIES.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setCity(c);
                              setOpen(false);
                            }}
                            className={cn(
                              "p-3 rounded-xl border border-slate-100 text-[11px] font-black uppercase tracking-wider transition-all",
                              city === c ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white hover:bg-slate-50"
                            )}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="saved" className="mt-0 space-y-4">
                {user ? (
                  savedAddresses.length > 0 ? (
                    <div className="grid gap-3">
                      {savedAddresses.map((addr) => (
                        <div key={addr.id} className="group relative">
                          <button
                            onClick={() => handleSelectLocation(addr)}
                            className="w-full flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all text-left"
                          >
                            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                              {getAddressIcon(addr.label)}
                            </div>
                            <div className="flex-1 min-w-0 pr-12">
                              <p className="text-sm font-black uppercase tracking-widest text-[#111827]">{addr.label}</p>
                              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{addr.address}</p>
                            </div>
                          </button>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 hover:text-blue-600">
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); removeSavedAddress(addr.id); }}
                              className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                        <Star className="h-8 w-8 text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-400">No saved addresses yet</p>
                      <Button variant="link" className="text-blue-600 font-bold mt-2">Add New Address</Button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="font-bold text-slate-600">Login to see saved addresses</p>
                    <Button className="mt-4 bg-blue-600 rounded-xl font-bold">Sign In</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recent" className="mt-0 space-y-4">
                {recentLocations.length > 0 ? (
                  <div className="space-y-2">
                    {recentLocations.map((loc, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all text-left border border-transparent hover:border-slate-100"
                      >
                        <History className="h-5 w-5 text-slate-300" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{loc.address}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{loc.locality || loc.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                     <p className="font-bold text-slate-400">No recent history</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {address && (
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Active Precision</p>
                  <p className="text-sm font-bold text-slate-900 truncate">{locality ? `${locality}, ` : ""}{city}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="text-blue-600 font-black uppercase text-[10px] tracking-widest">
                Refresh
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const POPULAR_CITIES = [
  "Hyderabad", "Mumbai", "Bangalore", "Delhi", "Chennai", "Pune", "Kolkata", "Ahmedabad", "Vijayawada"
];
