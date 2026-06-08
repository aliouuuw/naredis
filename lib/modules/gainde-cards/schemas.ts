import { z } from "zod";

const moneyField = z
  .string()
  .min(1, "Le montant est requis")
  .refine((v) => {
    try {
      const n = BigInt(v.replace(/\s/g, ""));
      return n > BigInt(0);
    } catch {
      return false;
    }
  }, "Montant invalide");

/** Règlement de carte (crédit). */
export const recordCardPaymentSchema = z.object({
  payingAgencyId: z.string().uuid(),
  amount: moneyField,
  effectiveDate: z.string().min(1, "La date est requise"),
  label: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export type RecordCardPaymentInput = z.infer<typeof recordCardPaymentSchema>;

/** Débit manuel sur carte (hors déclaration). */
export const recordCardDebitSchema = z.object({
  payingAgencyId: z.string().uuid(),
  debitTypeId: z.string().uuid(),
  amount: moneyField,
  effectiveDate: z.string().min(1, "La date est requise"),
  label: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export type RecordCardDebitInput = z.infer<typeof recordCardDebitSchema>;

/** @deprecated use recordCardPaymentSchema */
export const recordCardLoadSchema = recordCardPaymentSchema;
/** @deprecated use RecordCardPaymentInput */
export type RecordCardLoadInput = RecordCardPaymentInput;
