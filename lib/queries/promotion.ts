"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { mutate } from "@/lib/actions/result";

import { queryKeys } from "./keys";
import { listPromotionCandidates } from "@/lib/data/promotion";
import * as actions from "@/lib/actions/promotion";

// See the note in lib/queries/people.ts: bound to a const so useMutation can infer its variables
// type. Do not inline this into `mutationFn`.
const promoteStudents = mutate(actions.promoteStudents);

export const usePromotionCandidates = (classId: string | null, yearId: string | null) =>
  useQuery({
    queryKey: queryKeys.promotion.candidates(classId ?? "", yearId ?? ""),
    queryFn: () => listPromotionCandidates(classId as string, yearId as string),
    enabled: !!classId && !!yearId,
  });

/**
 * Run the promotion.
 *
 * Invalidates far more than the promotion list, because writing next year's enrollments changes
 * what almost every other screen counts: class rosters, student detail, the dashboard's totals and
 * the fee screens all read enrollments. A narrow invalidation would leave the app insisting Basic 3
 * still has the children who just moved up.
 */
export const usePromoteStudents = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: promoteStudents,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotion"] });
      qc.invalidateQueries({ queryKey: ["students"] });
      qc.invalidateQueries({ queryKey: ["academics"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["fees"] });
    },
  });
};
