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

export function useCreateFeeStructure() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.createFeeStructure,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fees"] }),
  });
}
