"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StudentForm } from "./student-form";

interface StudentFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The Students page's "Add New Student" drawer, the create form in a side sheet instead of
 * navigating to `/students/new` (which still exists for the Admissions "Convert to student" flow).
 * The form is only mounted while `open`, so its RHF state starts fresh every time the sheet opens.
 */
export function StudentFormSheet({ open, onOpenChange }: StudentFormSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-2">
          <SheetTitle>Add New Student</SheetTitle>
          <SheetDescription>
            Create a student record, assign a class, and add guardian &amp; contact details.
          </SheetDescription>
        </SheetHeader>
        {open && <StudentForm mode="create" onDone={() => onOpenChange(false)} variant="embedded" />}
      </SheetContent>
    </Sheet>
  );
}
