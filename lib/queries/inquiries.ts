"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";

import { queryKeys } from "./keys";
import * as data from "@/lib/data/inquiries";
import * as actions from "@/lib/actions/inquiries";


// Each action is bound to a const here rather than wrapped inline at `mutationFn`. That is not
// style: `mutationFn: mutate(actions.x)` is a generic call in a contextually-typed position, and
// TypeScript stops inferring useMutation's variables type through it; it silently falls back to
// `void`, so every `onSuccess(_result, variables)` below becomes an error. Binding first gives the
// property a concrete function type and inference works as it did before. Do not inline these.
const submitInquiry = mutate(actions.submitInquiry);
const setInquiryStatus = mutate(actions.setInquiryStatus);

export const useInquiries = () =>
  useQuery({ queryKey: queryKeys.inquiries.all, queryFn: data.listInquiries });

export const useInquiry = (id: string) =>
  useQuery({ queryKey: queryKeys.inquiries.detail(id), queryFn: () => data.getInquiry(id) });

// Marketing Admissions/Contact forms submit through this mutation only. The list/detail queries
// above are invalidated so the Admin → Admissions slice picks up fresh data automatically.
export const useSubmitInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitInquiry,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inquiries.all }),
  });
};

export const useSetInquiryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: setInquiryStatus,
    onSuccess: (_result, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.inquiries.all });
      qc.invalidateQueries({ queryKey: queryKeys.inquiries.detail(variables.id) });
      qc.invalidateQueries({ queryKey: queryKeys.sidebar.counts });
    },
  });
};
