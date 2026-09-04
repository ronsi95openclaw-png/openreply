"use client";

/**
 * Sidebar Navigation
 *
 * Text-only nav with active state and workspace section.
 */

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Overview", href: "/overview" },
  { label: "Inbox", href: "/inbox" },
  { label: "Campaigns", href: "/campaigns" },
  { label: "DM Logs", href: "/logs" },
  { label: "Settings", href: "/settings" },
  { label: "Diagnostics", href: "/diagnostics" },
];

interface SidebarProps {
  brandName: string;
  isOpen: boolean;
  onClose: () => void;
  workspaceName: string;
}

export default function Sidebar({
  brandName,
  isOpen,
  onClose,
  workspaceName,
}: SidebarProps) {
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}

      <aside
        id="dashboard-sidebar"
        aria-label="Primary navigation"
        className={`
          fixed top-0 left-0 z-50 h-dvh w-64 max-w-[85vw] shrink-0 bg-surface border-r border-border flex flex-col
          transition-transform duration-200 ease-out
          lg:h-full lg:visible lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}
        `}
      >
        {/* Same reason as the top bar: the drawer is full height, so the
            wordmark would otherwise land under the status bar. */}
        <div
          className="flex items-center justify-between gap-3 px-6 py-5 border-b border-border"
          style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
        >
          <Link href="/dashboard" className="text-base font-semibold">
            {brandName}
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded border border-border px-2 py-1 text-sm text-muted hover:text-foreground lg:hidden"
            aria-label="Close navigation"
          >
            Close
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={isActive ? "page" : undefined}
                className={`
                  block px-3 py-2.5 rounded text-sm
                  ${
                    isActive
                      ? "bg-surface-hover text-foreground font-medium"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border">
          <p className="text-sm text-foreground truncate">{workspaceName}</p>
          <p className="text-xs text-muted">Self-hosted</p>
        </div>
      </aside>
    </>
  );
}
