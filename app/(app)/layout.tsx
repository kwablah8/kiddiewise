"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SessionProvider, useSession } from "@/lib/auth/useSession";
import { AppShell } from "@/components/app/app-shell";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { Toaster } from "@/components/ui/sonner";

const ADMIN_ROLES = new Set(["school_admin", "super_admin"]);

function FullPageSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 flex-col gap-2 bg-[linear-gradient(180deg,var(--brand-top),var(--brand-bottom))] p-4 lg:flex">
        <SkeletonBlock className="mb-4 h-8 w-36 bg-white/10" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-9 w-full bg-white/10" />
        ))}
      </div>
      <div className="flex-1 space-y-6 p-6 lg:p-8">
        <SkeletonBlock className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-28 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { profile, isLoading } = useSession();
  const isAdmin = !!profile && ADMIN_ROLES.has(profile.role);

  useEffect(() => {
    if (isLoading) return;
    if (!profile) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/portal");
    }
  }, [isLoading, profile, isAdmin, router]);

  if (isLoading || !profile || !isAdmin) {
    return <FullPageSkeleton />;
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AppGuard>{children}</AppGuard>
      <Toaster />
    </SessionProvider>
  );
}
