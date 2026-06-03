import { z } from "zod";

const moneyField = z
  .union([z.string(), z.number(), z.bigint(), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "bigint" ? v : BigInt(String(v).replace(/\s/g, ""));
    if (n < BigInt(0)) throw new Error("Le montant doit être positif");
    return n;
  });

const nullableMoneyField = z
  .union([z.string(), z.number(), z.bigint(), z.literal(""), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === "" || v === null) return null;
    const n = typeof v === "bigint" ? v : BigInt(String(v).replace(/\s/g, ""));
    if (n < BigInt(0)) throw new Error("Le montant doit être positif");
    return n;
  });

export const createDeclarationSchema = z.object({
  customerId: z.string().uuid(),
  blReference: z.string().min(1, "Le numéro BL est requis"),
  zoneOrTerminal: z.string().optional(),
  declarationDate: z.string().optional(),
  containerCount: z.coerce.number().int().min(0).optional(),
  containers: z.array(z.string()).optional(),
  clientAmountPaid: moneyField,
  gaindeDutyAmount: moneyField,
  costPrice: moneyField,
  payingAgencyId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  dossierType: z.enum(["import", "export", "transit"]).optional(),
  title: z.string().optional(),
});

const updateDeclarationBase = z.object({
  zoneOrTerminal: z.string().optional().nullable(),
  declarationDate: z.string().optional().nullable(),
  blReference: z.string().optional().nullable(),
  containerCount: z.coerce.number().int().min(0).optional().nullable(),
  containers: z.array(z.string()).optional(),
  clientAmountPaid: nullableMoneyField,
  gaindeDutyAmount: nullableMoneyField,
  costPrice: nullableMoneyField,
  payingAgencyId: z
    .union([z.string().uuid(), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
  customsReference: z.string().optional().nullable(),
  bureau: z.string().optional().nullable(),
  bonADelivrer: z.boolean().optional(),
});

export const updateDeclarationSchema = updateDeclarationBase.partial();

export type CreateDeclarationInput = z.infer<typeof createDeclarationSchema>;
/** Raw form / action payload before Zod transforms (money as string). */
export type CreateDeclarationFormValues = z.input<typeof createDeclarationSchema>;
export type UpdateDeclarationInput = z.infer<typeof updateDeclarationSchema>;
export type UpdateDeclarationFormValues = z.input<typeof updateDeclarationSchema>;
