"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UsePresenceSync } from "@/hooks/use-presence-sync";
import { database } from "@/lib/firebase";
import { LecturerPresence } from "@/lib/types/lecture-presence";
import { Lecturer } from "@/lib/types/lecturer";
import { off, onValue, ref } from "firebase/database";
import { CalendarIcon, Clock, User } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes} WIB`;
}

export default function Home() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [todayPresence, setTodayPresence] = useState<LecturerPresence[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(true);
  const [isLoadingPresence, setIsLoadingPresence] = useState(true);

  UsePresenceSync();

  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedDateISO = formatDateISO(today);

  useEffect(() => {
    // Fetch lecturers with realtime updates
    const lecturersRef = ref(database, "lecturers");
    setIsLoadingLecturers(true);

    const handleLecturersData = (snapshot: any) => {
      if (!snapshot.exists()) {
        setLecturers([]);
        setIsLoadingLecturers(false);
        return;
      }

      const data = snapshot.val();
      const formattedData = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
      }));

      // Sort by status (hadir first) then by lastUpdated time (most recent first)
      formattedData.sort((a, b) => {
        if (a.status === "hadir" && b.status !== "hadir") return -1;
        if (a.status !== "hadir" && b.status === "hadir") return 1;
        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
      });

      setLecturers(formattedData);
      setIsLoadingLecturers(false);
    };

    const lecturersUnsubscribe = onValue(
      lecturersRef,
      handleLecturersData,
      (err) => {
        console.error("Error fetching lecturers:", err);
        setIsLoadingLecturers(false);
      }
    );

    // Fetch today's presence with realtime updates
    const presenceRef = ref(database, `lecturer_presence/${formattedDateISO}`);
    setIsLoadingPresence(true);

    const handlePresenceData = (snapshot: any) => {
      if (!snapshot.exists()) {
        setTodayPresence([]);
        setIsLoadingPresence(false);
        return;
      }

      const data = snapshot.val();
      const formattedData = Object.keys(data).map((key) => ({
        lecturerId: key,
        ...data[key],
      }));

      // Sort by time (most recent first)
      formattedData.sort((a, b) => b.time - a.time);

      setTodayPresence(formattedData);
      setIsLoadingPresence(false);
    };

    const presenceUnsubscribe = onValue(
      presenceRef,
      handlePresenceData,
      (err) => {
        console.error("Error fetching presence:", err);
        setIsLoadingPresence(false);
      }
    );

    return () => {
      off(lecturersRef);
      off(presenceRef);
    };
  }, [formattedDateISO]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 flex h-16 items-center justify-between ">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Clock className="h-5 w-5 text-primary" />
            <span>Sistem Absensi Dosen</span>
          </div>
          <Link href="/admin/dashboard" passHref>
            <Button variant="outline" size="sm">
              Admin Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-10 space-y-10">
        {/* Title & Date */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold tracking-tight">
            Status Kehadiran Dosen
          </h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            <span>{formattedDate}</span>
            <Link href="/history" passHref>
              <Button variant="link" size="sm" className="font-medium">
                Lihat Riwayat
              </Button>
            </Link>
          </div>
        </div>

        {/* Card - Kehadiran */}
        <Card>
          <CardHeader>
            <CardTitle>Status Kehadiran</CardTitle>
            <CardDescription>
              Menampilkan status kehadiran dosen hari ini
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLecturers ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </Card>
                ))}
              </div>
            ) : lecturers.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <User className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="text-lg font-semibold">Belum ada data dosen</h3>
                <p className="text-sm text-muted-foreground">
                  Data dosen akan muncul di sini setelah ditambahkan oleh admin.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lecturers.map((lecturer) => (
                  <Card
                    key={lecturer.id}
                    className={`transition duration-200 ${
                      lecturer.status === "hadir"
                        ? "border-green-500 shadow-md"
                        : "border-muted"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="truncate">
                          {lecturer.name}
                        </CardTitle>
                        <Badge
                          variant={
                            lecturer.status === "hadir" ? "default" : "outline"
                          }
                          className={
                            lecturer.status === "hadir"
                              ? "bg-green-500 text-white"
                              : "text-muted-foreground"
                          }
                        >
                          {lecturer.status === "hadir"
                            ? "Hadir"
                            : "Tidak Hadir"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-1">
                      <p>Kode: {lecturer.lecturerCode}</p>
                      {lecturer.status === "hadir" && lecturer.lastUpdated && (
                        <p className="text-xs">
                          Terakhir update: {formatTime(lecturer.lastUpdated)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card - Riwayat */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Kehadiran Hari Ini</CardTitle>
            <CardDescription>{formattedDateISO}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPresence ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center border-b pb-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : todayPresence.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Belum ada kehadiran hari ini.
              </div>
            ) : (
              <div className="space-y-3">
                {todayPresence.map((presence) => (
                  <div
                    key={presence.lecturerId}
                    className="flex justify-between items-center border-b pb-3"
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{presence.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {presence.lecturerCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(presence.time)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} RFID Attendance System. All rights
            reserved.
          </p>
          <Link
            href="/admin/dashboard"
            className="text-sm underline underline-offset-4"
          >
            Admin Panel
          </Link>
        </div>
      </footer>
    </div>
  );
}
