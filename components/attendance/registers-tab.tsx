"use client";

import { useState } from "react";
import { ChoicePills } from "@/components/daily-reports/choice-pills";
import { RegisterSummaryTab } from "@/components/attendance/register-summary-tab";
import { StaffRegisterTab } from "@/components/attendance/staff-register-tab";

type Who = "students" | "staff";

/** Term totals of who was present or absent: students from the class registers, staff from the gate. */
export function RegistersTab({ today }: { today: string }) {
  const [who, setWho] = useState<Who>("students");

  return (
    <div className="space-y-4">
      <ChoicePills<Who>
        ariaLabel="Show"
        value={who}
        onChange={(v) => v && setWho(v)}
        options={[
          { value: "students", label: "Students" },
          { value: "staff", label: "Staff" },
        ]}
      />
      {who === "students" ? <RegisterSummaryTab /> : <StaffRegisterTab today={today} />}
    </div>
  );
}
