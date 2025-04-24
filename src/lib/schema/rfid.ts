import { z } from "zod";

export const rfidSchema = z.object({
  uid: z.string(),
  value: z.string(),
  isAssigned: z.boolean().optional(),
  assignedTo: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type RfidTag = z.infer<typeof rfidSchema>;