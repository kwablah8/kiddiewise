"use client";

import { useState, type FormEvent } from "react";
import { Copy, Fingerprint, Loader2, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { SkeletonBlock } from "@/components/states/skeleton-block";
import {
  useCreateDevice,
  useDeleteDevice,
  useDevices,
  useRotateDeviceKey,
  useUpdateGateSettings,
} from "@/lib/queries/gate";
import { formatClockTime, formatDate } from "@/lib/format";
import { cardShellClass } from "@/lib/ui";
import { gateSettingsSchema, type DeviceVM, type GateSettingsVM } from "@/lib/validators/gate";

export function GateSettingsTab({ settings }: { settings: GateSettingsVM }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <TimesCard settings={settings} />
      <DevicesCard timeZone={settings.timezone} />
    </div>
  );
}

function TimesCard({ settings }: { settings: GateSettingsVM }) {
  const update = useUpdateGateSettings();
  const [lateAfter, setLateAfter] = useState(settings.late_after);
  const [leavingFrom, setLeavingFrom] = useState(settings.leaving_from);
  const [error, setError] = useState<string | null>(null);
  const changed = lateAfter !== settings.late_after || leavingFrom !== settings.leaving_from;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = gateSettingsSchema.safeParse({ late_after: lateAfter, leaving_from: leavingFrom });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the times.");
      return;
    }
    setError(null);
    try {
      await update.mutateAsync(parsed.data);
      toast.success("Times saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the times.");
    }
  }

  return (
    <form onSubmit={submit} className={cardShellClass} noValidate>
      <h3 className="text-base font-semibold text-[var(--text)]">Gate times</h3>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        A student who scans after the late time is marked late. Any scan from the leaving time
        onwards counts as leaving school.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="late_after">Late after</Label>
          <Input id="late_after" type="time" value={lateAfter} onChange={(e) => setLateAfter(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="leaving_from">Leaving from</Label>
          <Input id="leaving_from" type="time" value={leavingFrom} onChange={(e) => setLeavingFrom(e.target.value)} />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={!changed || update.isPending}>
          {update.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Save times
        </Button>
      </div>
    </form>
  );
}

function DevicesCard({ timeZone }: { timeZone: string }) {
  const devices = useDevices();
  const create = useCreateDevice();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("Main gate");
  const [error, setError] = useState<string | null>(null);
  // The key is only ever known here, right after it is issued.
  const [issued, setIssued] = useState<{ device: string; key: string } | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const { key } = await create.mutateAsync({ name });
      setAdding(false);
      setIssued({ device: name, key });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the device.");
    }
  }

  return (
    <section className={cardShellClass}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--text)]">Devices</h3>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Each fingerprint device gets a key, entered once into the program on the school computer.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="mt-4">
        {devices.isError ? (
          <ErrorState message="Couldn't load devices." onRetry={() => devices.refetch()} />
        ) : devices.isLoading ? (
          <SkeletonBlock className="h-16 w-full" />
        ) : (devices.data ?? []).length === 0 ? (
          <EmptyState icon={Fingerprint} title="No device yet" description="Add the gate device to get its key." />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {devices.data!.map((d) => (
              <DeviceRow key={d.id} device={d} timeZone={timeZone} onKey={(key) => setIssued({ device: d.name, key })} />
            ))}
          </ul>
        )}
      </div>

      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-sm">
          <form onSubmit={add} noValidate>
            <DialogHeader>
              <DialogTitle>Add device</DialogTitle>
              <DialogDescription>A name to tell devices apart, such as where it is mounted.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor="device_name">Name</Label>
              <Input id="device_name" value={name} onChange={(e) => setName(e.target.value)} />
              {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Add device
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <KeyDialog issued={issued} onClose={() => setIssued(null)} />
    </section>
  );
}

function DeviceRow({ device, timeZone, onKey }: { device: DeviceVM; timeZone: string; onKey: (key: string) => void }) {
  const rotate = useRotateDeviceKey();
  const remove = useDeleteDevice();
  const [confirm, setConfirm] = useState<"rotate" | "remove" | null>(null);

  async function run() {
    try {
      if (confirm === "rotate") {
        const { key } = await rotate.mutateAsync({ id: device.id });
        onKey(key);
      } else if (confirm === "remove") {
        await remove.mutateAsync({ id: device.id });
        toast.success("Device removed", { description: device.name });
      }
      setConfirm(null);
    } catch (err) {
      setConfirm(null);
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const pending = rotate.isPending || remove.isPending;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--text)]">{device.name}</p>
        <p className="text-xs text-[var(--muted-foreground)]">
          {device.last_seen_at
            ? `Last heard from ${formatDate(device.last_seen_at)}, ${formatClockTime(device.last_seen_at, timeZone)}`
            : "Not connected yet"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirm("rotate")}>
          New key
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setConfirm("remove")}>
          Remove
        </Button>
      </div>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm === "rotate" ? "Issue a new key?" : "Remove this device?"}</DialogTitle>
            <DialogDescription>
              {confirm === "rotate"
                ? `The current key for ${device.name} stops working immediately. The program on the school computer needs the new one before scans arrive again.`
                : `${device.name} will no longer be able to send scans. A device that has already sent scans can't be removed; issue a new key instead.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button type="button" variant={confirm === "remove" ? "destructive" : "default"} onClick={run} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {confirm === "rotate" ? "Issue new key" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}

function KeyDialog({ issued, onClose }: { issued: { device: string; key: string } | null; onClose: () => void }) {
  const endpoint = typeof window === "undefined" ? "" : `${window.location.origin}/api/attendance-device/scans`;

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${what} copied`);
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.");
    }
  }

  return (
    <Dialog open={issued !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Key for {issued?.device}</DialogTitle>
          <DialogDescription>
            Enter these two values in the program on the school computer. The key is shown only
            now; if it&rsquo;s lost, issue a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {[
            { label: "Server address", value: endpoint },
            { label: "Device key", value: issued?.key ?? "" },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <Label>{f.label}</Label>
              <div className="flex gap-2">
                <code className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs break-all text-[var(--text)]">
                  {f.value}
                </code>
                <Button type="button" size="icon-sm" variant="outline" aria-label={`Copy ${f.label}`} onClick={() => copy(f.value, f.label)}>
                  <Copy className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-6">
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
