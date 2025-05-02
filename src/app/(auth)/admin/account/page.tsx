"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import ProfileSection from "./_components/profile-section";
import PasswordSection from "./_components/password-section";
import { adminSchema } from "@/lib/schema/admin";
import { z } from "zod";
import { ref, update } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  getAuth,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { Header } from "../_components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AccountForm() {
  const { user } = useAuth();
  const auth = getAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (!user?.uid) throw new Error("User not authenticated");

      // Update email in Realtime Database
      await update(ref(database, `admins/${user.uid}`), {
        email: formData.email,
      });

      // Update password if provided
      if (formData.newPassword) {
        await handleResetPassword();
      }

      toast.success("Profil berhasil diperbarui");
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    try {
      adminSchema.pick({ email: true }).parse({ email: formData.email });

      if (formData.newPassword) {
        adminSchema
          .pick({ password: true })
          .parse({ password: formData.newPassword });
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Konfirmasi password tidak cocok");
        }
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      } else if (error instanceof Error) {
        setErrors({ general: error.message });
      }
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) throw new Error("Email tidak tersedia");
    const credential = EmailAuthProvider.credential(
      user.email,
      formData.currentPassword
    );
    await reauthenticateWithCredential(auth.currentUser!, credential);
    await updatePassword(auth.currentUser!, formData.newPassword);
    await update(ref(database, `admins/${user.uid}`), {
      password: formData.newPassword,
    });
  };

  return (
    <div className="p-4">
      <Header title="Profile" />

      <Card>
        <CardHeader>
          <CardTitle>Profile Admin</CardTitle>
          <CardDescription>
            Kelola Profile Admin yang login sistem
          </CardDescription>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ProfileSection
                email={formData.email}
                errors={errors}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, email: e.target.value }));
                  if (errors.email)
                    setErrors((prev) => ({ ...prev, email: "" }));
                }}
              />

              <PasswordSection
                currentPassword={formData.currentPassword}
                newPassword={formData.newPassword}
                confirmPassword={formData.confirmPassword}
                errors={errors}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }));
                  if (errors[e.target.name])
                    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
                }}
              />

              {errors.general && (
                <p className="text-sm text-destructive">{errors.general}</p>
              )}

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </CardHeader>
      </Card>
    </div>
  );
}
