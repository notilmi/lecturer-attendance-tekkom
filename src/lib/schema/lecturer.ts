import { string, z } from "zod";

export const lecturerSchema = z.object({
    name: z.string().min(1, "Nama wajib diisi"),
    lecturerCode: z.string().min(3, "Kode dosen minimal 3 karakter"),
    rfidUid: z.string().min(1, "RfidUid wajib diisi"),
    status: z.string().min(1, "Status wajib diisi"),
    lastUpdated: z.number().min(1),
    teachingDays: z.string().min(1)
});

export type Lecturer = z.infer<typeof lecturerSchema>