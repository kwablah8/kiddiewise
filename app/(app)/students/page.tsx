"use client";

import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StudentsTable } from "@/components/students/students-table";
import { cn } from "@/lib/utils";

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        subtitle="Manage student records, enrollment, and guardians."
        action={
          <Link href="/students/new" className={cn(buttonVariants())}>
            New Student
          </Link>
        }
      />
      <StudentsTable />
    </div>
  );
}
