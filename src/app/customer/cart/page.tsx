"use client"

import { useCart, useRemoveFromCart, useAddToCart } from "@/hooks/use-commerce";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Info, Package, Store, Calendar, Users, MapPin } from "lucide-react";

import { useCheckoutStore } from "@/store/checkoutStore";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";

import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const router = useRouter();
  const { data: cart, isLoading } = useCart();
  const { mutate: removeFromCart } = useRemoveFromCart();
  const { mutate: addToCart } = useAddToCart();

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const price = item.priceSnapshot || item.details?.price || item.details?.basePrice || 0;
    return acc + (Number(price) * item.quantity);
  }, 0);

  const updateQuantity = async (itemId: string, type: string, targetId: string, delta: number) => {
      addToCart({ type, targetId, quantity: delta });
  };

  const handleCheckoutClick = () => {
    if (items.length > 0) {
      const checkoutItems = items.map((item: any) => ({
        vendorId: item.vendorId || item.details?.vendorprofile?.id,
        vendorName: item.details?.vendorprofile?.businessName || "Vendor",
        serviceId: item.type === "SERVICE" ? item.targetId : item.details?.serviceId,
        packageId: item.type === "PACKAGE" ? item.targetId : "",
        packageName: item.details?.name || item.details?.title,
        basePrice: item.priceSnapshot || item.details?.price || item.details?.basePrice || 0,
        selectedAddonIds: item.addons || []
      }));

      useCheckoutStore.getState().setCheckoutItems(checkoutItems);
      // Set initial event details if first item has them
      const firstItem = items[0];
      if (firstItem.eventDate) {
          useCheckoutStore.getState().setEventDetails({
              date: firstItem.eventDate.split('T')[0],
              guestCount: firstItem.guestCount || 100,
              venue: firstItem.location,
          });
      }
      router.push("/customer/checkout");
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 pt-10 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.h2 variants={itemAnim} className="text-4xl font-black tracking-tight">Shopping Cart</motion.h2>
          <motion.p variants={itemAnim} className="text-muted-foreground text-lg mt-1">Single checkout for all your event services.</motion.p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-4">
                {[1, 2].map(i => (
                    <Card key={i} className="p-4 border-none shadow-sm flex gap-6">
                        <Skeleton className="h-32 w-48 rounded-2xl" />
                        <div className="flex-1 space-y-4">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-10 w-32 rounded-xl" />
                        </div>
                    </Card>
                ))}
            </div>
            <Skeleton className="h-96 rounded-[2.5rem]" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Build your dream event by adding services from our verified vendors."
          actionText="Explore Marketplace"
          actionHref="/marketplace"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item: any) => (
              <motion.div key={item.id} variants={itemAnim}>
                <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group bg-white">
                  <div className="p-6 flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 h-32 bg-slate-50 rounded-2xl flex items-center justify-center relative flex-shrink-0 overflow-hidden border">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                        {item.type === "PACKAGE" ? <Package className="h-10 w-10 text-primary/20" /> : <Store className="h-10 w-10 text-primary/20" />}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 mb-2">
                             {item.details?.vendorprofile?.businessName || 'Verified Vendor'}
                          </Badge>
                          <h3 className="text-xl font-black tracking-tight">{item.details?.name || item.details?.title}</h3>

                          <div className="flex flex-wrap gap-4 mt-3">
                              {item.eventDate && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      <Calendar className="h-3 w-3" /> {new Date(item.eventDate).toLocaleDateString()}
                                  </div>
                              )}
                              {item.guestCount && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      <Users className="h-3 w-3" /> {item.guestCount} Guests
                                  </div>
                              )}
                              {item.location && (
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      <MapPin className="h-3 w-3" /> {item.location}
                                  </div>
                              )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white shadow-none hover:shadow-sm"
                            onClick={() => updateQuantity(item.id, item.type, item.targetId, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white shadow-none hover:shadow-sm"
                            onClick={() => updateQuantity(item.id, item.type, item.targetId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Snapshot Price</p>
                            <p className="text-xl font-black text-primary">{formatCurrency(item.priceSnapshot || item.details?.price || item.details?.basePrice || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            <motion.div variants={itemAnim} className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex gap-4">
                <Info className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <p className="text-sm text-blue-800 font-medium leading-relaxed">
                    Prices are locked for your selected dates. Final confirmation depends on vendor availability after payment.
                </p>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div variants={itemAnim} className="sticky top-28">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
                    <div className="p-8 space-y-8">
                        <h3 className="text-2xl font-black tracking-tight">Order Summary</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Convenience Fee</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none">FREE</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <span className="text-slate-400 uppercase tracking-widest text-[10px]">Est. GST (18%)</span>
                                <span>{formatCurrency(subtotal * 0.18)}</span>
                            </div>

                            <div className="pt-6 border-t border-dashed space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black uppercase tracking-widest text-primary">Total Est.</span>
                                    <span className="text-3xl font-black">{formatCurrency(subtotal * 1.18)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase text-right tracking-widest">Pay 30% Advance at checkout</p>
                            </div>
                        </div>

                        <Button className="w-full h-16 rounded-2xl text-lg font-black group/btn bg-primary hover:bg-primary/90" size="lg" onClick={handleCheckoutClick}>
                            Proceed to Checkout
                            <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">PCI-DSS Compliant Payment</span>
                        </div>
                    </div>
                </Card>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
