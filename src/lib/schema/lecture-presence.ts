import { z } from "zod";

// LecturerPresence schema
export const lecturePresenceSchema = z.object({
    lecturerId: z.string(),
    name: z.string(),
    lecturerCode: z.string(),
    status: z.enum(["masuk", "pulang", "hadir"]).default("hadir"),
    time: z.number(),
    isScheduled: z.boolean().optional(),
    lastUpdated: z.number().optional(),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional(),
    rfidUid: z.string().optional(), 
});

export type LecturePresence = z.infer<typeof lecturePresenceSchema>;