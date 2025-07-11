"use client";

import React, { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const { user } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push("/admin/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const firstError = result.error.errors[0]?.message;
      setError(firstError);
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Login berhasil");
      router.push("/admin/dashboard");
    } catch (error: any) {
      console.log(error);
      setError(error.message);
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen w-full">
      <div className="flex items-center justify-center p-6 bg-white">
        <Card className="w-full max-w-md">
          <CardHeader className="flex flex-col items-center gap-2">
            <Image
              src="/logo_tekkom.png" // bisa public/logo.png
              alt="Logo Teknik Komputer"
              width={80}
              height={80}
              className="mb-2"
            />
            <CardTitle className="text-2xl font-bold text-center">
              Login Admin
            </CardTitle>
            <CardDescription className="text-center">
              Masukkan email dan password untuk masuk ke panel admin aplikasi informasi kehadiran dosen.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="max-w-sm mx-auto mb-2" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                {/* <AlertTitle>Error</AlertTitle> */}
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 max-w-sm mx-auto"
            >
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
              />
              <Input
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
              />
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? <>Logging in...</> : "Login"}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col">
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Informasi Kehadiran Dosen © 2025
            </p>
          </CardFooter>
        </Card>
      </div>
      <div className="relative hidden md:block w-full h-full min-h-screen">
        <Image
          src="https://teknikkomputer.polsri.ac.id/wp-content/uploads/2023/02/BG_FIRST_FEATURED.png"
          alt="Ilustrasi Login"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
}
