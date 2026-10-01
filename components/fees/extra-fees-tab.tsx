"use client";

import { useState } from "react";
import { Coins, Loader2, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchField } from "@/components/data/search-field";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ExtraFeeStructureDialog } from "./extra-fee-structure-dialog";
import { AssignExtraFeeDialog } from "./assign-extra-fee-dialog";
import { ExtraFeeCharges } from "./extra-fee-charges";
import { useDeleteExtraFeeStructure, useExtraFeeStructures } from "@/lib/queries/fees";
import {
  EXTRA_FREQUENCY_LABEL,
  type ExtraFeeStructureVM,
  type FeesFilter,
} from "@/lib/validators/fees";
import { formatGHS } from "@/lib/format";
import { matchesQuery } from "@/lib/search";
import { cardShellClass } from "@/lib/ui";
import { cn } from "@/lib/utils";

// Each dialog remounts on open (fresh form state), so it is keyed by an incrementing counter.
type Open =
  | { kind: "create" }
  | { kind: "edit"; fee: ExtraFeeStructureVM }
  | { kind: "assign"; feeId?: string }
  | null;

export function ExtraFeesTab({ filter }: { filter: FeesFilter }) {
  // The catalogue is not scoped by year or term, only by class.
  const structures = useExtraFeeStructures({ class_id: filter.class_id });
  const [open, setOpen] = useState<Open>(null);
  const [openKey, setOpenKey] = useState(0);
  const [toDelete, setToDelete] = useState<ExtraFeeStructureVM | null>(null);

  // Two independent searches, because these are two different questions. "Which extra fees do we
  // offer?" is asked of the structures; "has this child paid for transport?" is asked of the
  // charges. One shared box would make answering either awkward.
  const [structQuery, setStructQuery] = useState("");

  const show = (next: Open) => {
    setOpenKey((k) => k + 1);
    setOpen(next);
  };
  const close = (isOpen: boolean) => !isOpen && setOpen(null);

  const fees = structures.data ?? [];
  const structRows = fees.filter((r) =>
    matchesQuery(structQuery, r.name, r.description, r.scope, r.amount),
  );
  const structEmpty = !structures.isLoading && !structures.isError && structRows.length === 0;
  const noStructsAtAll = fees.length === 0;

  const structureColumns: DataTableColumn<ExtraFeeStructureVM>[] = [
    {
      key: "name",
      header: "Name",
      render: (r) => <span className="font-medium text-[var(--text)]">{r.name}</span>,
    },
    { key: "amount", header: "Amount", align: "right", render: (r) => formatGHS(r.amount) },
    {
      key: "frequency",
      header: "Frequency",
      hideOnMobile: true,
      render: (r) => EXTRA_FREQUENCY_LABEL[r.frequency],
    },
    { key: "scope", header: "Offered to", hideOnMobile: true, render: (r) => r.scope },
    {
      key: "charges",
      header: "Charges",
      align: "right",
      hideOnMobile: true,
      render: (r) => r.charge_count,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${r.name}`}
            className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
          >
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => show({ kind: "assign", feeId: r.id })}>
              Assign
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => show({ kind: "edit", fee: r })}>Edit</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              // A charged fee is referenced by its charges; the FK refuses the delete anyway.
              disabled={r.charge_count > 0}
              onClick={() => setToDelete(r)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => show({ kind: "create" })}>
          <Plus className="size-4" aria-hidden="true" />
          Create Extra Fee
        </Button>
        <Button type="button" disabled={noStructsAtAll} onClick={() => show({ kind: "assign" })}>
          Assign Extra Fee
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Extra Fee Structures</h2>
        <div className={cardShellClass}>
          <SearchField
            value={structQuery}
            onChange={setStructQuery}
            placeholder="Search by name or class"
            label="Search extra fee structures"
            className="mb-3"
          />
          {structures.isError ? (
            <ErrorState message="Couldn't load extra fee structures." onRetry={() => structures.refetch()} />
          ) : structEmpty ? (
            <EmptyState
              icon={Coins}
              title={noStructsAtAll ? "No extra fee structures" : "No matching extra fees"}
              description={
                noStructsAtAll
                  ? "Create an extra fee (transport, feeding, uniform, etc.) to assign to students."
                  : `Nothing matches “${structQuery}”. Check the spelling, or clear the search.`
              }
            />
          ) : (
            <DataTable
              columns={structureColumns}
              data={structRows}
              getRowId={(row) => row.id}
              isLoading={structures.isLoading}
            />
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-[var(--text)]">Assigned Extra Fees</h2>
        <div className={cardShellClass}>
          <ExtraFeeCharges filter={filter} />
        </div>
      </section>

      {(open?.kind === "create" || open?.kind === "edit") && (
        <ExtraFeeStructureDialog
          key={openKey}
          structure={open.kind === "edit" ? open.fee : undefined}
          open
          onOpenChange={close}
        />
      )}
      {open?.kind === "assign" && (
        <AssignExtraFeeDialog key={openKey} fees={fees} initialFeeId={open.feeId} open onOpenChange={close} />
      )}
      <ConfirmDeleteExtraFeeDialog fee={toDelete} onClose={() => setToDelete(null)} />
    </div>
  );
}

function ConfirmDeleteExtraFeeDialog({
  fee,
  onClose,
}: {
  fee: ExtraFeeStructureVM | null;
  onClose: () => void;
}) {
  const remove = useDeleteExtraFeeStructure();

  async function confirm() {
    if (!fee) return;
    try {
      await remove.mutateAsync({ id: fee.id });
      toast.success("Extra fee deleted", { description: `${fee.name} removed.` });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <Dialog open={!!fee} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this extra fee?</DialogTitle>
          <DialogDescription>
            {fee && (
              <>
                <strong className="text-[var(--text)]">
                  {fee.name}, {formatGHS(fee.amount)}
                </strong>{" "}
                will be removed from the list. It has never been charged to anyone.
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
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
