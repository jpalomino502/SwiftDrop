"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = window.setTimeout(() => {
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(id);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (
        anchor &&
        anchor.href &&
        anchor.href.startsWith(window.location.origin) &&
        anchor.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const url = new URL(anchor.href);
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return;
        }
        setLoading(true);
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => document.removeEventListener("click", handleAnchorClick);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-100 bg-transparent pointer-events-none">
      <div className="h-full bg-black dark:bg-white animate-progress-indeterminate origin-left" />
      <style jsx global>{`
        @keyframes progress-indeterminate {
          0% {
            width: 0%;
            margin-left: 0;
          }
          50% {
            width: 70%;
            margin-left: 0;
          }
          100% {
            width: 100%;
            margin-left: 0;
          }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 2s cubic-bezier(0.1, 0.4, 0.2, 1)
            infinite;
        }
      `}</style>
    </div>
  );
}
