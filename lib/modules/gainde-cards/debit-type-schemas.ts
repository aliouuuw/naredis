import { z } from "zod";

export const createGaindeCardDebitTypeSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(80),
});

export const updateGaindeCardDebitTypeSchema = z.object({
  debitTypeId: z.string().uuid(),
  name: z.string().min(1, "Le nom est requis").max(80),
});

export const setGaindeCardDebitTypeActiveSchema = z.object({
  debitTypeId: z.string().uuid(),
  active: z.boolean(),
});

export type CreateGaindeCardDebitTypeInput = z.infer<
  typeof createGaindeCardDebitTypeSchema
>;
export type UpdateGaindeCardDebitTypeInput = z.infer<
  typeof updateGaindeCardDebitTypeSchema
>;
export type SetGaindeCardDebitTypeActiveInput = z.infer<
  typeof setGaindeCardDebitTypeActiveSchema
>;
