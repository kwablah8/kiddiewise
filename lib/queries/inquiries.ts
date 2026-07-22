"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "./keys";
import * as actions from "@/lib/actions/inquiries";

// Marketing Admissions/Contact forms submit through this mutation only — components never call
// the action or touch the store directly. No list query reads `inquiries` yet (that's the future
// Admin → Admissions slice), but the key is invalidated now so that slice picks up fresh data
// for free once it exists.
export const useSubmitInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actions.submitInquiry,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inquiries.all }),
  });
};
