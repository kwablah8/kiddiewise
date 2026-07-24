"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAcademicYears, useClasses } from "@/lib/queries/academics";
import { FEE_TERM_LABEL, type FeeTerm, type FeesFilter } from "@/lib/validators/fees";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const TERMS: FeeTerm[] = ["full_year", "first", "second", "third"];

/** Class / Academic year / Term filter row driving the fees screens. */
export function FeesFilters({
  filter,
  onChange,
}: {
  filter: FeesFilter;
  onChange: (filter: FeesFilter) => void;
}) {
  const { data: classes } = useClasses();
  const { data: years } = useAcademicYears();
  const classOptions = classes ?? [];
  const yearOptions = years ?? [];

  return (
    <div className={cn(cardShellClass, "grid grid-cols-1 gap-4 sm:grid-cols-3")}>
      <Field label="Class">
        <Select
          value={filter.class_id ?? ALL}
          onValueChange={(v) => onChange({ ...filter, class_id: v && v !== ALL ? v : undefined })}
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v === ALL ? "All classes" : (classOptions.find((c) => c.id === v)?.name ?? "All classes")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All classes</SelectItem>
            {classOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Academic year">
        <Select
          value={filter.academic_year_id ?? ALL}
          onValueChange={(v) =>
            onChange({ ...filter, academic_year_id: v && v !== ALL ? v : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) =>
                v === ALL ? "All years" : (yearOptions.find((y) => y.id === v)?.name ?? "All years")
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All years</SelectItem>
            {yearOptions.map((y) => (
              <SelectItem key={y.id} value={y.id}>
                {y.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Term">
        <Select
          value={filter.term ?? ALL}
          onValueChange={(v) =>
            onChange({ ...filter, term: v && v !== ALL ? (v as FeeTerm) : undefined })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue>
              {(v: string) => (v === ALL ? "All terms" : (FEE_TERM_LABEL[v as FeeTerm] ?? "All terms"))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All terms</SelectItem>
            {TERMS.map((t) => (
              <SelectItem key={t} value={t}>
                {FEE_TERM_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium tracking-wide text-[var(--label)] uppercase">{label}</p>
      {children}
    </div>
  );
}
