import { z } from "zod";

export const createZoneSchema = z.object({
  slug: z
    .string()
    .min(1, "Le code zone est requis")
    .max(20, "20 caractères maximum"),
  label: z.string().min(1, "Le libellé est requis").max(120),
});

export const updateZoneSchema = z.object({
  zoneId: z.string().uuid(),
  label: z.string().min(1, "Le libellé est requis").max(120).optional(),
  isActive: z.boolean().optional(),
  /** Empty string clears the default carte. */
  defaultPayingAgencyId: z.string().uuid().or(z.literal("")).optional(),
});

export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
