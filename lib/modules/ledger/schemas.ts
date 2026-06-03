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

const transactionBodyFields = {
  transactionTypeId: z.string().uuid("Type de transaction invalide"),
  label: z.string().min(1, "Le libellé est requis"),
  amount: moneyField,
  effectiveDate: z.string().min(1, "La date est requise"),
  notes: z.string().optional(),
  dossierId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  declarationId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  allocations: z.array(allocationLineSchema).optional().default([]),
};

/** Client payload — `customerId` is supplied by the route/server action. */
export const recordTransactionBodySchema = z.object(transactionBodyFields);

export const recordTransactionSchema = z.object({
  customerId: z.string().uuid(),
  ...transactionBodyFields,
});

export const createTransactionTypeSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(80),
  balanceSide: z.enum(["debit", "credit"]),
});

/** @deprecated Use recordTransactionBodySchema */
export const recordVersementBodySchema = recordTransactionBodySchema;
export const recordVersementSchema = recordTransactionSchema;

/** @deprecated Use recordTransactionBodySchema */
export const recordChargeBodySchema = recordTransactionBodySchema;
export const recordChargeSchema = recordTransactionSchema;

export type RecordTransactionInput = z.infer<typeof recordTransactionSchema>;
export type RecordTransactionBodyValues = z.input<
  typeof recordTransactionBodySchema
>;
export type CreateTransactionTypeInput = z.infer<
  typeof createTransactionTypeSchema
>;
