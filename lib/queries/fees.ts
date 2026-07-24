"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "./keys";
import * as data from "@/lib/data/fees";
import * as actions from "@/lib/actions/fees";
import type { FeesFilter } from "@/lib/validators/fees";

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
    mutationFn: actions.createFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useBulkAssignFees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.bulkAssignFees,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useAssignIndividualFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.assignIndividualFee,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}

export function useCreateExtraFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createExtraFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}
