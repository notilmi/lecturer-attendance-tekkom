import { z } from "zod";

export const lecturerSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Nama wajib diisi"),
    lecturerCode: z.string().min(3, "Kode dosen minimal 3 karakter"),
    rfidUid: z.string().min(1, "RfidUid wajib diisi"),
    status: z.enum(["masuk", "pulang", "tidak hadir", "hadir"]).default("tidak hadir"),
    lastUpdated: z.number().optional(),
    teachingDays: z.array(z.string()).default([]),
    checkInTime: z.string().optional(),
    checkOutTime: z.string().optional()
});

export type Lecturer = z.infer<typeof lecturerSchema>