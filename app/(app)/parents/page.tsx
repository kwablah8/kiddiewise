"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import { ParentsTable } from "@/components/parents/parents-table";
import { cn } from "@/lib/utils";

export default function ParentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Parents"
        subtitle="Manage parent records and their linked children."
        action={
          <Link href="/parents/new" className={cn(buttonVariants())}>
            New Parent
          </Link>
        }
      />
      <ParentsTable />
    </div>
  );
}
