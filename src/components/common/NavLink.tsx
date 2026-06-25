"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If it's a standard internal link (not opening in new tab, not an external link, etc.)
    const isInternal = props.href.toString().startsWith("/") || props.href.toString().startsWith(window.location.origin);
    const isModified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

    if (isInternal && !isModified && props.target !== "_blank") {
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
