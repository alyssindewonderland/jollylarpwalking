import { z } from "zod";

export const ingestBodySchema = z.object({
  days: z
    .array(
      z.object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        steps: z.number().int().min(0).max(100_000),
      }),
    )
    .min(1)
    .max(14),
});
