# Code Verification - Validation & Location Integration Diffs

This document provides the actual code diffs for the changes made to `BookingWizard.tsx` and `src/app/customer/checkout/page.tsx` as requested.

## BookingWizard.tsx

```diff
--- src/components/booking/BookingWizard.tsx
+++ src/components/booking/BookingWizard.tsx
@@ -7,14 +7,24 @@
   ShoppingCart,
   ArrowLeft,
   RefreshCw,
   Plus,
+  MapPin,
+  Target,
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { GlassCard } from "@/components/ui/card";
 import { cn } from "@/lib/utils";
-
+import {
+  Dialog,
+  DialogContent,
+  DialogHeader,
+  DialogTitle,
+  DialogTrigger,
+} from "@/components/ui/dialog";
+import { LocationPicker } from "@/components/maps/LocationPicker";
+import { mapsService } from "@/services/client/maps.service";
 import {
   useEventTypes,
   useCategories,
@@ -62,10 +72,12 @@
   } = useCheckoutStore();

   const [availabilityError, setAvailabilityError] = useState<string | null>(null);
+  const [isDetecting, setIsDetecting] = useState(false);
+  const [isMapOpen, setIsMapOpen] = useState(false);

   // Data fetching
@@ -115,10 +127,47 @@
     } catch {
       toast.error("Failed to check availability");
     }
   };

+  const handleDetectLocation = () => {
+    if (!navigator.geolocation) {
+      toast.error("Geolocation is not supported by your browser");
+      return;
+    }
+
+    setIsDetecting(true);
+    navigator.geolocation.getCurrentPosition(
+      async (position) => {
+        try {
+          const { latitude, longitude } = position.coords;
+          const data = await mapsService.reverseGeocode(latitude, longitude);
+          if (data && data.display_name) {
+            setEventDetails({
+              venue: data.display_name,
+              city: data.address?.city || data.address?.town || "",
+              state: data.address?.state || "",
+              pincode: data.address?.postcode || "",
+            });
+            toast.success("Location detected!");
+          }
+        } catch (error) {
+          toast.error("Failed to get address from location");
+        } finally {
+          setIsDetecting(false);
+        }
+      },
+      (error) => {
+        toast.error("Location access denied or unavailable");
+        setIsDetecting(false);
+      },
+      { enableHighAccuracy: true, timeout: 10000 }
+    );
+  };
+
+  const handleMapSelect = (loc: { address: string; lat: number; lng: number }) => {
+    setEventDetails({
+      venue: loc.address,
+    });
+    setIsMapOpen(false);
+    toast.success("Location selected from map");
+  };
+
   const nextStep = () => setCurrentStep((Math.min(currentStep + 1, 10)) as any);
@@ -363,14 +412,54 @@
                     <input type="time" className="w-full h-16 bg-background rounded-2xl px-6 font-bold outline-none border-2 border-transparent focus:border-primary/50" value={eventDetails.time || "12:00"} onChange={(e) => setEventDetails({ time: e.target.value })} />
                 </div>
             </div>

-            <input
-                placeholder="Event Venue / Location"
-                className="w-full h-16 bg-secondary/30 rounded-2xl px-6 font-bold outline-none border-2 border-transparent focus:border-primary/50"
-                value={eventDetails.venue || ""}
-                onChange={(e) => setEventDetails({ venue: e.target.value })}
-            />
+            <div className="relative">
+              <input
+                  placeholder="Enter full address (e.g. building name, street, area)"
+                  className={cn(
+                    "w-full h-16 bg-secondary/30 rounded-2xl px-6 pr-24 font-bold outline-none border-2 transition-all",
+                    (eventDetails.venue?.length ?? 0) > 0 && (eventDetails.venue?.length ?? 0) < 5
+                      ? "border-rose-500 focus:border-rose-500"
+                      : "border-transparent focus:border-primary/50"
+                  )}
+                  value={eventDetails.venue || ""}
+                  onChange={(e) => setEventDetails({ venue: e.target.value })}
+              />
+              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
+                  <button
+                    onClick={handleDetectLocation}
+                    disabled={isDetecting}
+                    title="Detect Current Location"
+                    className="p-3 hover:bg-white/50 rounded-xl transition-colors text-primary disabled:opacity-50"
+                  >
+                    {isDetecting ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Target className="h-5 w-5" />}
+                  </button>
+                  <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
+                    <DialogTrigger asChild>
+                      <button
+                        title="Pick on Map"
+                        className="p-3 hover:bg-white/50 rounded-xl transition-colors text-slate-600"
+                      >
+                        <MapPin className="h-5 w-5" />
+                      </button>
+                    </DialogTrigger>
+                    <DialogContent className="max-w-3xl">
+                      <DialogHeader>
+                        <DialogTitle>Select Event Location</DialogTitle>
+                      </DialogHeader>
+                      <LocationPicker onLocationSelect={handleMapSelect} />
+                    </DialogContent>
+                  </Dialog>
+              </div>
+            </div>
+
+            {(eventDetails.venue?.length ?? 0) > 0 && (eventDetails.venue?.length ?? 0) < 5 && (
+              <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest ml-4 -mt-6">
+                Address is too short (min 5 characters)
+              </p>
+            )}

-            <Button className="w-full h-16 rounded-2xl text-lg font-black" variant="premium" onClick={nextStep} disabled={!!availabilityError || !eventDetails.date || !eventDetails.venue}>
+            <Button
+                className="w-full h-16 rounded-2xl text-lg font-black"
+                variant="premium"
+                onClick={nextStep}
+                disabled={!!availabilityError || !eventDetails.date || (eventDetails.venue?.length ?? 0) < 5}
+            >
                 Review Booking
             </Button>
```

## Enterprise Checkout (page.tsx)

```diff
--- src/app/customer/checkout/page.tsx
+++ src/app/customer/checkout/page.tsx
@@ -19,14 +19,26 @@
   MapPin,
   Clock,
   Calendar,
-  Users
+  Users,
+  Target,
 } from "lucide-react";
 import { cn } from "@/lib/utils";
 import Link from "next/link";

 import { customerService } from "@/services/client";
 import { vendorService } from "@/services/client";
 import { marketplaceService } from "@/services/client";
+import { mapsService } from "@/services/client/maps.service";
+
+import {
+  Dialog,
+  DialogContent,
+  DialogHeader,
+  DialogTitle,
+  DialogTrigger,
+} from "@/components/ui/dialog";
+import { LocationPicker } from "@/components/maps/LocationPicker";

 import { formatCurrency } from "@/lib/utils";
@@ -61,8 +73,10 @@

   const [isValidating, setIsValidating] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [availabilityError, setAvailabilityError] = useState<string | null>(null);
+  const [isDetecting, setIsDetecting] = useState(false);
+  const [isMapOpen, setIsMapOpen] = useState(false);
   const [idempotencyKey] = useState(() => Math.random().toString(36).substring(7));

@@ -141,6 +155,42 @@
     }
   }, [searchParams, selection.vendorId, setVendor, setServiceType, setPackage, calculatePricing, setEventDetails, toast]);

+  const handleDetectLocation = () => {
+    if (!navigator.geolocation) {
+      toast({ variant: "destructive", title: "Error", description: "Geolocation is not supported" });
+      return;
+    }
+
+    setIsDetecting(true);
+    navigator.geolocation.getCurrentPosition(
+      async (position) => {
+        try {
+          const { latitude, longitude } = position.coords;
+          const data = await mapsService.reverseGeocode(latitude, longitude);
+          if (data && data.display_name) {
+            setEventDetails({
+              venue: data.display_name,
+              city: data.address?.city || data.address?.town || "",
+              state: data.address?.state || "",
+              pincode: data.address?.postcode || "",
+            });
+            toast({ title: "Location Detected", description: "Address pre-filled successfully." });
+          }
+        } catch (error) {
+          toast({ variant: "destructive", title: "Error", description: "Failed to reverse geocode location." });
+        } finally {
+          setIsDetecting(false);
+        }
+      },
+      (error) => {
+        toast({ variant: "destructive", title: "Error", description: "Location access denied." });
+        setIsDetecting(false);
+      }
+    );
+  };
+
+  const handleMapSelect = (loc: { address: string; lat: number; lng: number }) => {
+    setEventDetails({ venue: loc.address });
+    setIsMapOpen(false);
+  };
+
   const validateAvailability = async () => {
@@ -304,14 +354,40 @@
                     </div>
                     <div className="space-y-2">
                         <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Venue Name / Address</Label>
-                        <Input
-                            placeholder="Where is the event happening?"
-                            value={eventDetails.venue || ""}
-                            onChange={e => setEventDetails({ venue: e.target.value })}
-                            className="h-12 rounded-xl"
-                        />
+                        <div className="relative">
+                            <Input
+                                placeholder="Enter full address (e.g. building name, street, area)"
+                                value={eventDetails.venue || ""}
+                                onChange={e => setEventDetails({ venue: e.target.value })}
+                                className={cn(
+                                    "h-12 rounded-xl pr-20",
+                                    (eventDetails.venue?.length ?? 0) > 0 && (eventDetails.venue?.length ?? 0) < 5 && "border-rose-500 focus-visible:ring-rose-500"
+                                )}
+                            />
+                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
+                                <button
+                                    onClick={handleDetectLocation}
+                                    type="button"
+                                    disabled={isDetecting}
+                                    className="p-2 hover:bg-slate-100 rounded-lg text-primary disabled:opacity-50"
+                                    title="Detect current location"
+                                >
+                                    {isDetecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
+                                </button>
+                                <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
+                                    <DialogTrigger asChild>
+                                        <button type="button" className="p-2 hover:bg-slate-100 rounded-lg text-slate-500" title="Pick on Map">
+                                            <MapPin className="h-4 w-4" />
+                                        </button>
+                                    </DialogTrigger>
+                                    <DialogContent className="max-w-3xl">
+                                        <DialogHeader><DialogTitle>Select Location</DialogTitle></DialogHeader>
+                                        <LocationPicker onLocationSelect={handleMapSelect} />
+                                    </DialogContent>
+                                </Dialog>
+                            </div>
+                        </div>
+                        {(eventDetails.venue?.length ?? 0) > 0 && (eventDetails.venue?.length ?? 0) < 5 && (
+                            <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight">Address is too short (min 5 characters)</p>
+                        )}
                     </div>
                     <div className="grid grid-cols-2 gap-4">
@@ -325,10 +401,10 @@
                     </div>
                     <Button
                         className="bg-primary hover:bg-blue-700 text-white font-black h-12 px-8 rounded-xl"
                         onClick={validateAvailability}
-                        disabled={isValidating || !eventDetails.date || !eventDetails.venue}
+                        disabled={isValidating || !eventDetails.date || (eventDetails.venue?.length ?? 0) < 5}
                     >
                         {isValidating ? <RefreshCw className="animate-spin h-5 w-5" /> : "Verify Availability"}
                     </Button>
```
