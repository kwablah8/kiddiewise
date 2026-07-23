"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "./keys";
import * as data from "@/lib/data/inquiries";
import * as actions from "@/lib/actions/inquiries";

export const useInquiries = () =>
  useQuery({ queryKey: queryKeys.inquiries.all, queryFn: data.listInquiries });

export const useInquiry = (id: string) =>
  useQuery({ queryKey: queryKeys.inquiries.detail(id), queryFn: () => data.getInquiry(id) });

// Marketing Admissions/Contact forms submit through this mutation only. The list/detail queries
// above are invalidated so the Admin → Admissions slice picks up fresh data automatically.
export const useSubmitInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.submitInquiry,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inquiries.all }),
  });
};

export const useSetInquiryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.setInquiryStatus,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.inquiries.all });
      qc.invalidateQueries({ queryKey: queryKeys.inquiries.detail(variables.id) });
      qc.invalidateQueries({ queryKey: queryKeys.sidebar.counts });
    },
  });
};
