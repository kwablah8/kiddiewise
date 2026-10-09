"use client";

import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoicePills } from "@/components/daily-reports/choice-pills";
import { useDevicePeople, usePresence } from "@/lib/queries/gate";
import { formatClockTime } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import type { PersonKind, PresenceVM } from "@/lib/validators/gate";

interface Row {
  id: string;
  name: string;
  detail: string | null;
  arrived_at: string | null;
  left_at: string | null;
  late: boolean;
}

/** Who came through the gate on a day, and when. Staff who didn't scan are listed as well. */
export function CheckinsTab({ timeZone, today }: { timeZone: string; today: string }) {
  const [date, setDate] = useState(today);
  const [kind, setKind] = useState<PersonKind>("student");
  const presence = usePresence(date);
  const people = useDevicePeople();

  const time = (iso: string | null) =>
    iso ? formatClockTime(iso, timeZone) : <span className="text-[var(--muted-foreground)]">—</span>;

  const columns: DataTableColumn<Row>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
    { key: "detail", header: kind === "student" ? "Class" : "Role", hideOnMobile: true, render: (r) => r.detail ?? "—" },
    { key: "arrived", header: "Arrived", render: (r) => time(r.arrived_at) },
    { key: "left", header: "Left", render: (r) => time(r.left_at) },
    {
      key: "status",
      header: "Status",
      render: (r) =>
        r.arrived_at ? (
          <StatusPill label={r.late ? "Late" : "On time"} tone={r.late ? "warning" : "success"} />
        ) : r.left_at ? (
          <StatusPill label="No arrival scan" tone="neutral" />
        ) : (
          <StatusPill label="Not checked in" tone="neutral" />
        ),
    },
  ];

  const scanned = (presence.data ?? []).filter((p) => p.person?.kind === kind);
  const unlinked = (presence.data ?? []).filter((p) => p.person === null);
  const rows: Row[] = scanned.map((p) => toRow(p));
  if (kind === "staff") {
    // Staff are few, so the whole staff list is shown and the absences are visible at a glance.
    const seen = new Set(rows.map((r) => r.id));
    for (const p of people.data ?? []) {
      if (p.kind === "staff" && !seen.has(p.id)) {
        rows.push({ id: p.id, name: p.name, detail: p.detail, arrived_at: null, left_at: null, late: false });
      }
    }
  }

  const studentsOnRoll = (people.data ?? []).filter((p) => p.kind === "student").length;
  const isLoading = presence.isLoading || people.isLoading;

  return (
    <div className="space-y-4">
      <div className={`${cardShellClass} flex flex-wrap items-end gap-4`}>
        <div className="space-y-1.5">
          <Label htmlFor="gate_date">Date</Label>
          <Input
            id="gate_date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className="w-44"
          />
        </div>
        <ChoicePills<PersonKind>
          ariaLabel="Show"
          value={kind}
          onChange={(v) => v && setKind(v)}
          options={[
            { value: "student", label: "Students" },
            { value: "staff", label: "Staff" },
          ]}
        />
        {kind === "student" && !isLoading && !presence.isError && (
          <p className="ml-auto text-sm text-[var(--muted-foreground)]">
            {rows.filter((r) => r.arrived_at).length} of {studentsOnRoll} students checked in
          </p>
        )}
      </div>

      <div className={cardShellClass}>
        {presence.isError || people.isError ? (
          <ErrorState
            message="Couldn't load check-ins."
            onRetry={() => {
              void presence.refetch();
              void people.refetch();
            }}
          />
        ) : isLoading ? (
          <SkeletonBlock className="h-40 w-full" />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Fingerprint}
            title="No check-ins"
            description={
              date === today
                ? "Nobody has scanned at the gate yet today."
                : "Nobody scanned at the gate on this day."
            }
          />
        ) : (
          <DataTable columns={columns} data={rows} getRowId={(r) => r.id} />
        )}
      </div>

      {unlinked.length > 0 && (
        <div className={cardShellClass}>
          <h3 className="text-sm font-semibold text-[var(--text)]">Numbers not linked to anyone</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            These device numbers scanned but aren&rsquo;t linked to a student or staff member. Link them
            under Device numbers and their scans will appear above.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unlinked.map((u) => (
              <li
                key={u.device_user_id}
                className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--text)]"
              >
                No. {u.device_user_id}
                <span className="text-[var(--muted-foreground)]">
                  {" · "}
                  {formatClockTime((u.arrived_at ?? u.left_at)!, timeZone)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function toRow(p: PresenceVM): Row {
  return {
    id: p.person!.id,
    name: p.person!.name,
    detail: p.person!.detail,
    arrived_at: p.arrived_at,
    left_at: p.left_at,
    late: p.late,
  };
}
