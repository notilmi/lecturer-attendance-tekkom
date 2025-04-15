"use client"

import { useAuth } from "@/contexts/auth-context";
import LoginForm from "./_components/login-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
      const router = useRouter();
    
      const {user, loading} = useAuth()

     useEffect(() => {
        if (!loading && user) {
            router.push("/admin/dashboard");
          }
      }, [user, loading, router])

    if (loading) {
        return (
          <div className="min-h-screen flex justify-center items-center">
            Loading...
          </div>
        );
      }

    return (
        <div className="min-h-screen flex justify-center items-center">
            <LoginForm/>
        </div>
    )
}