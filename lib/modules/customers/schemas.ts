import { z } from "zod";

const optionalMoney = z
  .union([z.string(), z.number(), z.bigint()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "bigint" ? v : BigInt(String(v).replace(/\s/g, ""));
    if (n <= BigInt(0)) {
      throw new Error("Le montant doit être strictement positif");
    }
    return n;
  });

const customerCoreSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

const openingBalanceFields = {
  openingBalanceAmount: optionalMoney,
  openingBalanceSide: z.enum(["debit", "credit"]).optional(),
  openingBalanceDate: z.string().optional(),
} as const;

function refineOpeningBalancePair(
  data: {
    openingBalanceAmount?: bigint;
    openingBalanceSide?: "debit" | "credit";
  },
  ctx: z.RefinementCtx,
) {
  const hasAmount = data.openingBalanceAmount != null;
  const hasSide = data.openingBalanceSide != null;
  if (hasAmount !== hasSide) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Pour un solde d'ouverture, indiquez le montant et le sens (débit ou crédit).",
      path: ["openingBalanceAmount"],
    });
  }
}

export const createCustomerSchema = customerCoreSchema
  .extend(openingBalanceFields)
  .superRefine(refineOpeningBalancePair);

export const updateCustomerSchema = customerCoreSchema.partial().extend({
  accountStatus: z.enum(["a_jour", "pas_a_jour"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type CreateCustomerFormInput = z.input<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
