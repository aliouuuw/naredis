import { z } from "zod";

const moneyField = z
  .union([z.string(), z.number(), z.bigint()])
  .transform((v) => {
    const n = typeof v === "bigint" ? v : BigInt(String(v).replace(/\s/g, ""));
    if (n <= BigInt(0)) {
      throw new Error("Le montant doit être strictement positif");
    }
    return n;
  });

export const allocationLineSchema = z.object({
  dossierId: z.string().uuid(),
  amount: moneyField,
});

export const recordVersementSchema = z.object({
  customerId: z.string().uuid(),
  label: z.string().min(1, "Le libellé est requis"),
  amount: moneyField,
  effectiveDate: z.string().min(1, "La date est requise"),
  notes: z.string().optional(),
  allocations: z.array(allocationLineSchema).optional().default([]),
});

export const recordChargeSchema = z.object({
  customerId: z.string().uuid(),
  label: z.string().min(1, "Le libellé est requis"),
  amount: moneyField,
  effectiveDate: z.string().min(1, "La date est requise"),
  category: z.enum(["honoraires", "debours", "other"]).optional(),
  dossierId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  declarationId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  notes: z.string().optional(),
});

export type RecordVersementInput = z.infer<typeof recordVersementSchema>;
export type RecordVersementFormValues = z.input<typeof recordVersementSchema>;
export type RecordChargeInput = z.infer<typeof recordChargeSchema>;
export type RecordChargeFormValues = z.input<typeof recordChargeSchema>;
