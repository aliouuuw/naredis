import { z } from "zod";

export const LIST_VIEW_PAGE_KEYS = [
  "declarations",
  "clients",
  "transactions",
] as const;

export type ListViewPageKey = (typeof LIST_VIEW_PAGE_KEYS)[number];

export const createListViewSchema = z.object({
  pageKey: z.enum(LIST_VIEW_PAGE_KEYS),
  name: z
    .string()
    .trim()
    .min(1, "Le nom est requis.")
    .max(80, "Nom trop long (80 caractères max)."),
  query: z.string().max(4000),
});

export const deleteListViewSchema = z.object({
  viewId: z.string().uuid(),
  pageKey: z.enum(LIST_VIEW_PAGE_KEYS),
});
