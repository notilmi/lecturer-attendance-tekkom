"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ref, set, push, update, off } from "firebase/database";
import { auth, database } from "@/lib/firebase/";
import { Admin } from "@/lib/schema/admin";
import { signInWithEmailAndPassword } from "firebase/auth";

interface AdminFormProps {
  initialData?: Admin;
  onSuccess?: () => void;
  updateAdminList: (Admin: Admin) => void;
}

export function AdminForm({ initialData, onSuccess, updateAdminList }: AdminFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState(
    initialData?.password || ""
  );

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      password: "",
    };

    if (email.trim().length < 3) {
      newErrors.email = "Email harus diisi";
      valid = false;
    }

    if (password.trim().length < 1) {
      newErrors.password = "Password harus diisi";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data
      const adminData = {
        email,
        password,
        lastUpdated: Date.now(),
      };

      if (initialData?.id) {
        const adminRef = ref(database, `admins/${initialData.id}`);
        await update(adminRef, adminData);
        updateAdminList({ ...adminData, id: initialData.id});
      } else {
        // Add new lecturer
        const adminRef = ref(database, "admins");
        const newAdminRef = push(adminRef);
        await set(newAdminRef, adminData);
        updateAdminList({ ...adminData, id: newAdminRef.key || ""});
        signInWithEmailAndPassword(auth, adminData.email, adminData.password);
        // Reset form after successful submission
        setEmail("");
        setPassword("");
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast("Gagal", {
        description: error.message || "Terjadi kesalahan saat menyimpan data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh RFID list
  const refreshRfidList = () => {
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Email</Label>
        <Input
          id="email"
          placeholder="Masukkan email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Password</Label>
        <Input
          id="password"
          placeholder="Masukkan password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {initialData && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          Tambah Admin
        </Button>
      </div>
    </form>
  );
}
