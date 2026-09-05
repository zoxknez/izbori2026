import { z } from "zod";

export const sourceSchema = z.object({
  id: z.string().min(1), tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  type: z.enum(["law", "bylaw", "rik", "court", "odihr", "observer_report", "other"]).optional(),
  label: z.string().min(1), url: z.string().url(), description: z.string().optional(), publisher: z.string().optional(),
  version: z.string().optional(), validFromDate: z.string().optional(), validUntilDate: z.string().optional(),
  status: z.enum(["active", "superseded", "archived"]).optional(), supersedesId: z.string().optional(), lastCheckedAt: z.string().datetime().optional(),
});

export type SourceSchema = z.infer<typeof sourceSchema>;
