"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import * as data from "@/lib/data/sidebar";

export const useSidebarCounts = () =>
  useQuery({ queryKey: queryKeys.sidebar.counts, queryFn: data.getSidebarCounts });
