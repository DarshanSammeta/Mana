"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { animateHover?: boolean }
>(({ className, animateHover = false, ...props }, ref) => {
  if (animateHover) {
    return (
      <motion.div
        ref={ref as any}
        whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
        className={cn(
          "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-lg hover:border-primary/10 hover:bg-white",
          className
        )}
        {...(props as any)}
      />
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all duration-200",
        className
      )}
      {...props}
    />
  )
})
Card.displayName = "Card"

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { animateHover?: boolean }
>(({ className, animateHover = true, ...props }, ref) => {
  return (
    <motion.div
      ref={ref as any}
      whileHover={animateHover ? { y: -2 } : {}}
      className={cn(
        "bg-white/80 backdrop-blur-md border border-white/20 rounded-xl p-6 transition-all duration-300 shadow-sm",
        className
      )}
      {...(props as any)}
    />
  )
})
GlassCard.displayName = "GlassCard"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-lg leading-none tracking-tight text-slate-900", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-muted-foreground font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, GlassCard, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
