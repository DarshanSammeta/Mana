import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  actionHref,
  onActionClick,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20 px-4 border-2 border-dashed rounded-[2.5rem] bg-muted/5 flex flex-col items-center w-full"
    >
      <div className="p-6 rounded-full bg-white shadow-sm border border-border mb-6">
        <Icon className="h-12 w-12 text-[#6D28D9]" />
      </div>
      <h3 className="text-2xl font-black mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto font-medium">
        {description}
      </p>
      {actionText && (
        actionHref ? (
          <Link href={actionHref}>
            <Button
              size="lg"
              className="rounded-full px-8 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold h-12 shadow-lg shadow-purple-200"
            >
              {actionText}
            </Button>
          </Link>
        ) : (
          <Button
            size="lg"
            onClick={onActionClick}
            className="rounded-full px-8 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-bold h-12 shadow-lg shadow-purple-200"
          >
            {actionText}
          </Button>
        )
      )}
    </motion.div>
  );
}
