"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";

import { queryKeys } from "./keys";
import * as data from "@/lib/data/fees";
import * as actions from "@/lib/actions/fees";
import type { FeesFilter } from "@/lib/validators/fees";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic call in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it; it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const createFeeStructure = mutate(actions.createFeeStructure);
const updateFeeStructure = mutate(actions.updateFeeStructure);
const deleteFeeStructure = mutate(actions.deleteFeeStructure);
const bulkAssignFees = mutate(actions.bulkAssignFees);
const assignIndividualFee = mutate(actions.assignIndividualFee);
const createExtraFeeStructure = mutate(actions.createExtraFeeStructure);
const updateExtraFeeStructure = mutate(actions.updateExtraFeeStructure);
const deleteExtraFeeStructure = mutate(actions.deleteExtraFeeStructure);
const assignExtraFee = mutate(actions.assignExtraFee);
const updateExtraFeeCharge = mutate(actions.updateExtraFeeCharge);
const deleteExtraFeeCharge = mutate(actions.deleteExtraFeeCharge);
const recordPayment = mutate(actions.recordPayment);
const recordExtraFeePayment = mutate(actions.recordExtraFeePayment);

export function useFeesOverview(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.overview(filter),
    queryFn: () => data.getFeesOverview(filter),
  });
}

export function useFeeStructures(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.structures(filter),
    queryFn: () => data.listFeeStructures(filter),
  });
}

export function usePayments(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.payments(filter),
    queryFn: () => data.listPayments(filter),
  });
}

export function useClassFees(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.classFees(filter),
    queryFn: () => data.listClassFees(filter),
  });
}

export function useExtraFeeStructures(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.extraStructures(filter),
    queryFn: () => data.listExtraFeeStructures(filter),
  });
}

export function useExtraFeeAssignments(filter: FeesFilter) {
  return useQuery({
    queryKey: queryKeys.fees.extraAssignments(filter),
    queryFn: () => data.listExtraFeeAssignments(filter),
  });
}

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useUpdateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useDeleteFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useBulkAssignFees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkAssignFees,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useAssignIndividualFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignIndividualFee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useCreateExtraFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createExtraFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useUpdateExtraFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateExtraFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useDeleteExtraFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExtraFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useAssignExtraFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: assignExtraFee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useUpdateExtraFeeCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateExtraFeeCharge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useDeleteExtraFeeCharge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteExtraFeeCharge,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useRecordExtraFeePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recordExtraFeePayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}
