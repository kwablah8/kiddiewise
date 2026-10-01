"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { AssignExtraFeeDialog } from "./assign-extra-fee-dialog";
import { ExtraFeeCharges } from "./extra-fee-charges";
import { useActiveContext } from "@/lib/queries/academics";
import { useExtraFeeStructures } from "@/lib/queries/fees";
import { cardShellClass } from "@/lib/ui";

/** One student's extra-fee charges for the active year, with assign and per-charge actions. */
export function StudentExtraFees({
  student,
}: {
  student: { id: string; name: string; class_id: string | null };
}) {
  const active = useActiveContext();
  const structures = useExtraFeeStructures({});
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignKey, setAssignKey] = useState(0);
  const year = active.data?.active_year ?? null;

  return (
    <section className={cardShellClass}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[var(--text)]">
          Extra fees{year ? ` · ${year.name}` : ""}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!year || (structures.data?.length ?? 0) === 0}
          onClick={() => {
            setAssignKey((k) => k + 1);
            setAssignOpen(true);
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          Assign
        </Button>
      </div>

      <div className="mt-4">
        {/* Wait for the active year, otherwise the list loads unscoped first and then reloads. */}
        {active.isLoading ? (
          <SkeletonBlock className="h-24 w-full" />
        ) : (
          <ExtraFeeCharges
            filter={year ? { student_id: student.id, academic_year_id: year.id } : { student_id: student.id }}
            showStudent={false}
          />
        )}
      </div>

      {assignOpen && (
        <AssignExtraFeeDialog
          key={assignKey}
          fees={structures.data ?? []}
          student={student}
          open
          onOpenChange={setAssignOpen}
        />
      )}
    </section>
  );
}
