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

export const updateTransactionTypeSchema = z.object({
  transactionTypeId: z.string().uuid(),
  name: z.string().min(1, "Le nom est requis").max(80),
});

export const setTransactionTypeActiveSchema = z.object({
  transactionTypeId: z.string().uuid(),
  active: z.boolean(),
});

export const openingBalanceBodySchema = z.object({
  amount: moneyField,
  balanceSide: z.enum(["debit", "credit"], {
    message: "Choisissez débit ou crédit",
  }),
  effectiveDate: z.string().min(1, "La date est requise").optional(),
  label: z.string().optional(),
  notes: z.string().optional(),
});

export const reverseLedgerEntryBodySchema = z.object({
  reason: z
    .string()
    .min(3, "Indiquez le motif de la contre-passation (3 caractères min.)"),
  effectiveDate: z.string().min(1, "La date est requise").optional(),
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
export type UpdateTransactionTypeInput = z.infer<
  typeof updateTransactionTypeSchema
>;
export type SetTransactionTypeActiveInput = z.infer<
  typeof setTransactionTypeActiveSchema
>;
export type OpeningBalanceBodyValues = z.input<typeof openingBalanceBodySchema>;
export type ReverseLedgerEntryBodyValues = z.input<
  typeof reverseLedgerEntryBodySchema
>;
