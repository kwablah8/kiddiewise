"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MoreHorizontal, Receipt } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { StatusPill } from "@/components/data/status-pill";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecordPaymentDialog } from "./record-payment-dialog";
import { feeStatusTone } from "./fee-status";
import {
  useDeleteExtraFeeCharge,
  useExtraFeeAssignments,
  useUpdateExtraFeeCharge,
} from "@/lib/queries/fees";
import { chargePeriodLabel } from "@/lib/fees/extra";
import {
  FEE_STATUS_LABEL,
  updateExtraFeeChargeSchema,
  type ExtraFeeAssignmentVM,
  type FeesFilter,
} from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

type Action = { kind: "pay" | "edit" | "remove"; charge: ExtraFeeAssignmentVM };

/**
 * The extra-fee charges in `filter`, with a payment, amount correction or removal on each row.
 * Shared by the Fees screen (every student) and a student's profile (`showStudent` off).
 */
export function ExtraFeeCharges({
  filter,
  showStudent = true,
}: {
  filter: FeesFilter;
  showStudent?: boolean;
}) {
  const charges = useExtraFeeAssignments(filter);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState<Action | null>(null);

  const rows = (charges.data ?? []).filter((r) =>
    matchesQuery(query, r.student_name, r.class_name, r.fee_name, chargePeriodLabel(r)),
  );
  const isEmpty = !charges.isLoading && !charges.isError && rows.length === 0;
  const noneAtAll = (charges.data?.length ?? 0) === 0;

  const columns: DataTableColumn<ExtraFeeAssignmentVM>[] = [
    ...(showStudent
      ? [
          {
            key: "student",
            header: "Student",
            render: (r: ExtraFeeAssignmentVM) => (
              <span className="font-medium text-[var(--text)]">{r.student_name}</span>
            ),
          },
        ]
      : []),
    {
      key: "fee",
      header: "Fee",
      hideOnMobile: showStudent,
      render: (r) =>
        showStudent ? r.fee_name : <span className="font-medium text-[var(--text)]">{r.fee_name}</span>,
    },
    { key: "period", header: "Period", hideOnMobile: true, render: (r) => chargePeriodLabel(r) },
    ...(showStudent
      ? [{ key: "class", header: "Class", hideOnMobile: true, render: (r: ExtraFeeAssignmentVM) => r.class_name }]
      : []),
    { key: "amount", header: "Amount", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.amount) },
    { key: "paid", header: "Paid", align: "right", hideOnMobile: true, render: (r) => formatGHS(r.paid) },
    { key: "balance", header: "Balance", align: "right", render: (r) => formatGHS(r.balance) },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusPill label={FEE_STATUS_LABEL[r.status]} tone={feeStatusTone(r.status)} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${r.student_name}'s ${r.fee_name}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={r.balance <= 0}
              onClick={() => setAction({ kind: "pay", charge: r })}
            >
              Record payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setAction({ kind: "edit", charge: r })}>
              Edit amount
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              // A paid charge is part of the ledger; the FK refuses its removal anyway.
              disabled={r.paid > 0}
              onClick={() => setAction({ kind: "remove", charge: r })}
            >
              Remove charge
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {showStudent && (
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by student, class, fee or period"
          label="Search assigned extra fees"
          className="mb-3"
        />
      )}
      {charges.isError ? (
        <ErrorState message="Couldn't load extra fee charges." onRetry={() => charges.refetch()} />
      ) : isEmpty ? (
        <EmptyState
          icon={Receipt}
          title={noneAtAll ? "No extra fees charged" : "No matching charges"}
          description={
            noneAtAll
              ? showStudent
                ? "Use Assign Extra Fee to charge a fee to students."
                : "This student hasn't been charged any extra fees this year."
              : `Nothing matches “${query}”. Check the spelling, or clear the search.`
          }
        />
      ) : (
        <DataTable columns={columns} data={rows} getRowId={(row) => row.id} isLoading={charges.isLoading} />
      )}

      {action?.kind === "pay" && (
        <RecordPaymentDialog
          key={action.charge.id}
          target={{ kind: "extra", charge: action.charge }}
          onClose={() => setAction(null)}
        />
      )}
      {action?.kind === "edit" && (
        <EditChargeDialog key={action.charge.id} charge={action.charge} onClose={() => setAction(null)} />
      )}
      <RemoveChargeDialog
        charge={action?.kind === "remove" ? action.charge : null}
        onClose={() => setAction(null)}
      />
    </>
  );
}

function EditChargeDialog({ charge, onClose }: { charge: ExtraFeeAssignmentVM; onClose: () => void }) {
  const update = useUpdateExtraFeeCharge();
  const [amount, setAmount] = useState(String(charge.amount));
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = updateExtraFeeChargeSchema.safeParse({ id: charge.id, amount });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter an amount");
      return;
    }
    try {
      await update.mutateAsync(parsed.data);
      toast.success("Charge updated", {
        description: `${charge.student_name}'s ${charge.fee_name} is now ${formatGHS(parsed.data.amount)}.`,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Edit charge</DialogTitle>
            <DialogDescription>
              {charge.student_name} · {charge.fee_name}, {chargePeriodLabel(charge)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-1.5">
            <Label htmlFor="ec_amount">Amount (₵)</Label>
            <Input
              id="ec_amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={amount}
              aria-invalid={!!error}
              onChange={(e) => setAmount(e.target.value)}
            />
            {charge.paid > 0 && (
              <p className="text-xs text-[var(--muted-foreground)]">
                {formatGHS(charge.paid)} already paid, so it can&rsquo;t go below that.
              </p>
            )}
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RemoveChargeDialog({
  charge,
  onClose,
}: {
  charge: ExtraFeeAssignmentVM | null;
  onClose: () => void;
}) {
  const remove = useDeleteExtraFeeCharge();

  async function confirm() {
    if (!charge) return;
    try {
      await remove.mutateAsync({ id: charge.id });
      toast.success("Charge removed", {
        description: `${charge.fee_name} removed from ${charge.student_name}.`,
      });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!charge} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove this charge?</DialogTitle>
          <DialogDescription>
            {charge && (
              <>
                <strong className="text-[var(--text)]">
                  {charge.fee_name}, {chargePeriodLabel(charge)} · {formatGHS(charge.amount)}
                </strong>{" "}
                will no longer be owed by {charge.student_name}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={confirm} disabled={remove.isPending}>
            {remove.isPending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
