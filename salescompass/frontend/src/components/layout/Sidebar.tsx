"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FlaskConical, LayoutDashboard, Sparkles } from "lucide-react";
import { navItems } from "@/data/copy";

const icons = {
  Dashboard: LayoutDashboard,
  Analyze: Sparkles,
  Evaluation: BarChart3,
  Demo: FlaskConical
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="grid gap-1">
        {navItems.map((item) => {
          const Icon = icons[item.label as keyof typeof icons];
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition ${
                active ? "bg-white text-signal shadow-panel" : "text-neutral-600 hover:bg-white"
              }`}
            >
              <Icon aria-hidden className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

