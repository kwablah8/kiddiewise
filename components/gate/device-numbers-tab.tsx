"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Users } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoicePills } from "@/components/daily-reports/choice-pills";
import { useDevicePeople, useSetDeviceUserId } from "@/lib/queries/gate";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";
import type { DevicePersonVM } from "@/lib/validators/gate";

type Filter = "all" | "student" | "staff" | "unlinked";

/**
 * The number each person is enrolled under on the device. One list for the whole school, because
 * numbers are entered in bulk the day the device is set up, not one profile at a time.
 */
export function DeviceNumbersTab() {
  const people = useDevicePeople();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = (people.data ?? []).filter(
    (p) =>
      (filter === "all" ||
        (filter === "unlinked" ? p.device_user_id === null : p.kind === filter)) &&
      matchesQuery(query, p.name, p.detail, p.device_user_id),
  );
  const unlinkedCount = (people.data ?? []).filter((p) => p.device_user_id === null).length;

  const columns: DataTableColumn<DevicePersonVM>[] = [
    { key: "name", header: "Name", render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span> },
    { key: "detail", header: "Class / role", hideOnMobile: true, render: (r) => r.detail ?? "—" },
    { key: "number", header: "Device number", render: (r) => <NumberCell key={`${r.kind}:${r.id}:${r.device_user_id ?? ""}`} person={r} /> },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Enter the number each person is enrolled under on the fingerprint device (User ID on the
        device). Students should use their own range, for example from 1000, so no number is shared
        with staff.
        {unlinkedCount > 0 && ` ${unlinkedCount} not linked yet.`}
      </p>
      <div className={cardShellClass}>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by name, class or number"
            label="Search people"
            className="min-w-56 flex-1"
          />
          <ChoicePills<Filter>
            ariaLabel="Show"
            value={filter}
            onChange={(v) => setFilter(v ?? "all")}
            options={[
              { value: "all", label: "Everyone" },
              { value: "student", label: "Students" },
              { value: "staff", label: "Staff" },
              { value: "unlinked", label: "Not linked" },
            ]}
          />
        </div>
        {people.isError ? (
          <ErrorState message="Couldn't load students and staff." onRetry={() => people.refetch()} />
        ) : !people.isLoading && rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title={(people.data?.length ?? 0) === 0 ? "No students or staff yet" : "No matches"}
            description={
              (people.data?.length ?? 0) === 0
                ? "Add students and staff first, then link them to the device here."
                : "Nothing matches this search or filter."
            }
          />
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            getRowId={(r) => `${r.kind}:${r.id}`}
            isLoading={people.isLoading}
            pageSize={25}
          />
        )}
      </div>
    </div>
  );
}

function NumberCell({ person }: { person: DevicePersonVM }) {
  const save = useSetDeviceUserId();
  const [value, setValue] = useState(person.device_user_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const trimmed = value.trim();
  const changed = trimmed !== (person.device_user_id ?? "");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!changed) return;
    setError(null);
    try {
      await save.mutateAsync({
        person: { kind: person.kind, id: person.id },
        device_user_id: trimmed === "" ? null : trimmed,
      });
      toast.success(trimmed === "" ? "Device number removed" : "Device number saved", {
        description: trimmed === "" ? person.name : `${person.name} is No. ${trimmed}.`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the number.");
    }
  }

  return (
    <form onSubmit={submit} className="flex items-start gap-2">
      <div className="space-y-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          placeholder="Not linked"
          aria-label={`Device number for ${person.name}`}
          aria-invalid={!!error}
          className="h-8 w-28"
        />
        {error && <p className="max-w-56 text-xs text-[var(--danger)]">{error}</p>}
      </div>
      {/* Always rendered, hidden until there is something to save, so the column doesn't jump. */}
      <Button
        type="submit"
        size="sm"
        variant="outline"
        disabled={!changed || save.isPending}
        className={changed ? undefined : "invisible"}
        aria-hidden={!changed}
        tabIndex={changed ? undefined : -1}
      >
        {save.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Save
      </Button>
    </form>
  );
}
