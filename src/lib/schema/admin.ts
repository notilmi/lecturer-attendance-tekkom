import { z } from "zod";

export const adminSchema = z.object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(5, "Password minimal 5 karakter")
});

export type Admin = z.infer<typeof adminSchema>