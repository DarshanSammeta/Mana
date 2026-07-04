"use client";

import Link, { LinkProps } from "next/link";
import { useLoadingStore } from "@/store/loadingStore";
import { ReactNode } from "react";

interface NavLinkProps extends LinkProps {
  children: ReactNode;
  className?: string;
  onLoadingMessage?: string;
  prefetch?: boolean;
  target?: string;
}

export default function NavLink({
  children,
  className,
  onLoadingMessage = "Loading page...",
  prefetch = true,
  ...props
}: NavLinkProps) {
  const { setIsLoading } = useLoadingStore();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Standard Next.js navigation handles prefetching and loading states.
    // We only trigger global loading for specific heavy transitions if needed.
    // By default, we let NextTopLoader handle the visual feedback for speed.

    const isInternal = props.href.toString().startsWith("/") || props.href.toString().startsWith(window.location.origin);
    const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

    // Only show global loader for very slow links if explicitly requested, otherwise stay instant
    if (onLoadingMessage !== "Loading page..." && isInternal && !isModified && props.target !== "_blank") {
      setIsLoading(true, onLoadingMessage);
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <Link {...props} className={className} onClick={handleClick} prefetch={prefetch}>
      {children}
    </Link>
  );
}
