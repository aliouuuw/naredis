import { z } from "zod";

export const createAgencySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  notes: z.string().max(500).optional(),
});

export const updateAgencySchema = z.object({
  agencyId: z.string().uuid(),
  name: z.string().min(1, "Le nom est requis").max(120).optional(),
  notes: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAgencyInput = z.infer<typeof createAgencySchema>;
export type UpdateAgencyInput = z.infer<typeof updateAgencySchema>;
