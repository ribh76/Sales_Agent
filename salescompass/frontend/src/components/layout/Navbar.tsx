"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3 font-semibold text-ink">
          <Image src="/logo.svg" alt="" width={36} height={36} priority />
          <span>SalesCompass</span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-neutral-600 sm:inline">{user.full_name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<LogOut aria-hidden className="h-4 w-4" />}
                onClick={signOut}
                title="Sign out"
              >
                Sign out
              </Button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-signal hover:text-ink">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

