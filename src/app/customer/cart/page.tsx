"use client"

import { useCart, useRemoveFromCart, useAddToCart } from "@/hooks/useCommerce";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Info, Package, Store } from "lucide-react";
import Link from "next/link";

import { useCheckoutStore } from "@/store/checkoutStore";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";

import { formatCurrency } from "@/utils/format";

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { mutate: removeFromCart } = useRemoveFromCart();
  const { mutate: addToCart } = useAddToCart();

  const items = cart?.items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const price = item.details?.price || item.details?.basePrice || 0;
    return acc + (Number(price) * item.quantity);
  }, 0);



  const updateQuantity = async (itemId: string, type: string, targetId: string, delta: number) => {
      addToCart({ type, targetId, quantity: delta });
  };

  const handleCheckoutClick = () => {
    if (items.length > 0) {
      const firstItem = items[0];
      const vendorId = firstItem.details?.vendorId || firstItem.details?.vendor?.id;
      const serviceId = firstItem.type === "SERVICE" ? firstItem.targetId : firstItem.details?.serviceId;
      const packageId = firstItem.type === "PACKAGE" ? firstItem.targetId : undefined;

      useCheckoutStore.getState().setVendorInfo({
        vendorId,
        serviceId,
        packageId,
        vendorName: firstItem.details?.vendor?.businessName || firstItem.details?.name,
        packageName: firstItem.type === "PACKAGE" ? firstItem.details?.name : undefined,
        basePrice: firstItem.details?.price || firstItem.details?.basePrice || 0
      });
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <motion.h2 variants={itemAnim} className="text-4xl font-black tracking-tight">Your Cart</motion.h2>
          <motion.p variants={itemAnim} className="text-muted-foreground text-lg mt-1">Review and finalize your event services selection.</motion.p>
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
          description="Looks like you haven&apos;t added any services to your event plan yet. Start exploring our verified vendors to build your dream event."
          actionText="Start Exploring"
          actionHref="/marketplace"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {items.map((item: any) => (
              <motion.div key={item.id} variants={itemAnim}>
                <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group">
                  <div className="p-6 flex flex-col sm:flex-row gap-6">
                    <div className="w-full sm:w-48 h-32 bg-secondary/30 rounded-2xl flex items-center justify-center relative flex-shrink-0 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
                        {item.type === "PACKAGE" ? <Package className="h-10 w-10 text-primary/20" /> : <Store className="h-10 w-10 text-primary/20" />}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="secondary" className="bg-primary/5 text-primary border-none text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 mb-2">
                             {item.type === "PACKAGE" ? "Service Package" : "Individual Service"}
                          </Badge>
                          <h3 className="text-xl font-black tracking-tight">{item.details?.title || item.details?.name}</h3>
                          <p className="text-sm text-muted-foreground font-medium mt-1 line-clamp-1">
                            {item.type === "PACKAGE" ? `By ${item.details?.vendor?.businessName || 'Verified Vendor'}` : item.details?.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-4 bg-secondary/50 p-1 rounded-2xl border border-border/50">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-black/20 shadow-none hover:shadow-sm"
                            onClick={() => updateQuantity(item.id, item.type, item.targetId, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-black/20 shadow-none hover:shadow-sm"
                            onClick={() => updateQuantity(item.id, item.type, item.targetId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">Price</p>
                            <p className="text-xl font-black">{formatCurrency(item.details?.price || item.details?.basePrice || 0)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            <motion.div variants={itemAnim} className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex gap-4">
                <Info className="h-6 w-6 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800 font-medium">
                    Please note that final availability depends on the vendor&apos;s schedule for your specific event dates. Proceeding to checkout will notify the vendors.
                </p>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <motion.div variants={itemAnim} className="sticky top-28">
                <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white dark:bg-black/40">
                    <div className="p-8 space-y-8">
                        <h3 className="text-2xl font-black tracking-tight">Summary</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Subtotal</span>
                                <span className="font-bold">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Platform Fee</span>
                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none font-bold">FREE</Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Taxes (GST)</span>
                                <span className="font-bold">Included</span>
                            </div>

                            <div className="pt-6 border-t border-dashed space-y-1">
                                <div className="flex justify-between items-end">
                                    <span className="text-lg font-black uppercase tracking-widest text-primary">Total Amount</span>
                                    <span className="text-3xl font-black">{formatCurrency(subtotal)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase text-right tracking-widest">Inclusive of all taxes</p>
                            </div>
                        </div>

                        <Button className="w-full h-16 rounded-2xl text-lg font-black group/btn" size="lg" asChild variant="premium" onClick={handleCheckoutClick}>
                            <Link href="/customer/checkout">
                                Secure Checkout
                                <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Secured by Razorpay</span>
                        </div>
                    </div>
                </Card>

                <div className="mt-6 p-6 flex flex-col items-center gap-4">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-10 w-10 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium text-center">
                        Joined 10,000+ customers planning their dream events.
                    </p>
                </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
