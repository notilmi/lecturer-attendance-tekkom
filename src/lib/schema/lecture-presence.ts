import { z } from "zod";

export const lecturePresenceSchema = z.object({
  lecturerId: z.string(),
  name: z.string(),
  lecturerCode: z.string(),
  time: z.number(), // timestamp
  status: z.string(),
  isScheduled: z.boolean().optional(),
});

export type LecturePresence = z.infer<typeof lecturePresenceSchema>;