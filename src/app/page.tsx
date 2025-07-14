"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Filter, User, LogIn, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase/";
import { Lecturer } from "@/lib/schema/lecturer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LecturePresence } from "@/lib/schema/lecture-presence";
import { getDayName } from "@/utils/day-utils";
import { useAuth } from "@/contexts/auth-context";
import InstallButton from "@/components/install-button";

export default function HomePage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [todayPresence, setTodayPresence] = useState<LecturePresence[]>([]);
  const [isLoadingLecturers, setIsLoadingLecturers] = useState(true);
  const [isLoadingPresence, setIsLoadingPresence] = useState(true);
  const [showOnlyScheduled, setShowOnlyScheduled] = useState(false);

  const { user } = useAuth();

  // Get current day name
  const today = new Date();
  const currentDay = getDayName(today);

  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedDateISO = formatDateISO(today);

  // Check if lecturer has teaching schedule today
  const hasTeachingScheduleToday = (lecturer: Lecturer) => {
    return lecturer.teachingDays?.includes(currentDay) || false;
  };

  // Determine if a lecturer is present (either checked in or stayed)
  const isLecturerPresent = (lecturer: Lecturer) => {
    return (
      lecturer.status === "masuk" ||
      lecturer.status === "pulang" 
    );
  };

  // Filter lecturers based on teaching schedule and presence
  const getFilteredLecturers = () => {
    if (!showOnlyScheduled) {
      // Show all lecturers, but prioritize those with schedule today
      return [...lecturers].sort((a, b) => {
        // First sort by presence status (present first)
        const aIsPresent = isLecturerPresent(a);
        const bIsPresent = isLecturerPresent(b);
        if (aIsPresent && !bIsPresent) return -1;
        if (!aIsPresent && bIsPresent) return 1;

        // Then sort by teaching schedule (today's schedule first)
        const aHasSchedule = hasTeachingScheduleToday(a);
        const bHasSchedule = hasTeachingScheduleToday(b);
        if (aHasSchedule && !bHasSchedule) return -1;
        if (!aHasSchedule && bHasSchedule) return 1;

        // Then sort by lastUpdated time (most recent first)
        return (b.lastUpdated || 0) - (a.lastUpdated || 0);
      });
    } else {
      // Show only lecturers with schedule today and those who came despite not having a schedule
      return lecturers
        .filter(
          (lecturer) =>
            hasTeachingScheduleToday(lecturer) || isLecturerPresent(lecturer)
        )
        .sort((a, b) => {
          // First sort by presence status (present first)
          const aIsPresent = isLecturerPresent(a);
          const bIsPresent = isLecturerPresent(b);
          if (aIsPresent && !bIsPresent) return -1;
          if (!aIsPresent && bIsPresent) return 1;

          // Then sort by teaching schedule (today's schedule first)
          const aHasSchedule = hasTeachingScheduleToday(a);
          const bHasSchedule = hasTeachingScheduleToday(b);
          if (aHasSchedule && !bHasSchedule) return -1;
          if (!aHasSchedule && bHasSchedule) return 1;

          // Then sort by lastUpdated time (most recent first)
          return (b.lastUpdated || 0) - (a.lastUpdated || 0);
        });
    }
  };

  const filteredLecturers = getFilteredLecturers();

  useEffect(() => {
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
        // Ensure teachingDays exists
        teachingDays: data[key].teachingDays || [],
      }));

      console.log("Lecturers data structure:", data);
      const sampleLecturer =
        Object.keys(data).length > 0 ? data[Object.keys(data)[0]] : null;
      console.log("Sample lecturer:", sampleLecturer);

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

    // Fetch today's presence
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

    // Clean up listeners on unmount
    return () => {
      off(lecturersRef);
      off(presenceRef);
    };
  }, [formattedDateISO]);

  // Helper to get status text and badge color
  const getLecturerStatusInfo = (lecturer: Lecturer) => {
    // If the lecturer has checked in or checked out, they're present
    if (lecturer.status === "masuk") {
      return {
        text: "Hadir",
        color: "bg-green-100 text-green-800 hover:bg-green-200",
      };
    } else if (lecturer.status === "pulang") {
      return {
        text: "Hadir (Telah Pulang)",
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      };
    } else {
      return {
        text: "Belum Hadir",
        color: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base">Sistem Absensi Dosen</span>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Mobile: hanya ikon user */}
                <Button
                  variant="outline"
                  size="icon"
                  className="flex sm:hidden"
                  title={user.email ?? undefined}
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                </Button>

                {/* Desktop: ikon + email */}
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <p className="font-medium text-sm max-w-[120px] truncate">
                    {user?.email}
                  </p>
                </Button>

                <Link href="/admin/dashboard" passHref>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/admin/dashboard" passHref>
                <Button variant="outline" size="sm">
                  Admin Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-3xl font-bold">Status Kehadiran Dosen</h1>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id="scheduled-filter"
              checked={showOnlyScheduled}
              onCheckedChange={setShowOnlyScheduled}
            />
            <Label
              htmlFor="scheduled-filter"
              className="flex items-center gap-1"
            >
              <Filter className="h-4 w-4" />
              <span>Tampilkan hanya dosen dengan jadwal hari {currentDay}</span>
            </Label>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: {filteredLecturers.length} dosen
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Status Kehadiran</CardTitle>
            <CardDescription>
              Menampilkan status kehadiran dosen hari ini
              {showOnlyScheduled ? ` (${currentDay})` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingLecturers ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredLecturers.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-lg font-medium">
                  {showOnlyScheduled
                    ? "Tidak ada dosen yang memiliki jadwal hari ini"
                    : "Belum ada data dosen"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {showOnlyScheduled
                    ? "Coba nonaktifkan filter untuk melihat semua dosen"
                    : "Data dosen akan muncul di sini setelah ditambahkan oleh admin"}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredLecturers.map((lecturer) => {
                  const isScheduledToday = hasTeachingScheduleToday(lecturer);
                  const statusInfo = getLecturerStatusInfo(lecturer);
                  const isPresent = isLecturerPresent(lecturer);

                  return (
                    <Card
                      key={lecturer.id}
                      className={`${isPresent ? "border-green-500" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <CardTitle className="truncate">
                            {lecturer.name}
                          </CardTitle>
                          <Badge
                            className={`${statusInfo.color} sm:self-auto self-start mt-3`}
                          >
                            {statusInfo.text}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            Kode: {lecturer.lecturerCode}
                          </p>
                          {isScheduledToday && (
                            <Badge variant="outline" className="ml-2">
                              Jadwal {currentDay}
                            </Badge>
                          )}
                        </div>
                        {isPresent && lecturer.lastUpdated && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Terakhir update:{" "}
                              {formatTime(lecturer.lastUpdated)}
                            </p>
                            {lecturer.status === "masuk" && (
                              <p className="text-xs text-green-600 flex items-center">
                                <LogIn className="h-3 w-3 mr-1" />
                                Check-in: {formatTime(lecturer.lastUpdated)}
                              </p>
                            )}
                            {lecturer.status === "pulang" && (
                              <p className="text-xs text-blue-600 flex items-center">
                                <LogOut className="h-3 w-3 mr-1" />
                                Check-out: {formatTime(lecturer.lastUpdated)}
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

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
                    <div className="flex items-center gap-2">
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
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  Belum ada kehadiran hari ini
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayPresence.map((presence) => {
                  // Find the lecturer to check if they have schedule today
                  const lecturer = lecturers.find(
                    (l) => l.id === presence.lecturerId
                  );
                  const isScheduledToday = lecturer
                    ? hasTeachingScheduleToday(lecturer)
                    : false;

                  // Get icon based on status
                  const StatusIcon =
                    presence.status === "masuk"
                      ? LogIn
                      : presence.status === "pulang"
                      ? LogOut
                      : User;

                  return (
                    <div
                      key={
                        presence.lecturerId +
                        "-" +
                        (presence.time || Math.random())
                      }
                      className="flex justify-between items-center border-b pb-3"
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon
                          className={`h-4 w-4 ${
                            presence.status === "masuk"
                              ? "text-green-500"
                              : presence.status === "pulang"
                              ? "text-blue-500"
                              : "text-muted-foreground"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{presence.name}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-muted-foreground">
                              {presence.lecturerCode}
                            </p>
                            {isScheduledToday && (
                              <Badge variant="outline" className="text-xs">
                                Jadwal
                              </Badge>
                            )}
                            {!isScheduledToday && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-50"
                              >
                                Di luar jadwal
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                presence.status === "masuk"
                                  ? "bg-green-50 text-green-800"
                                  : presence.status === "pulang"
                                  ? "bg-blue-50 text-blue-800"
                                  : ""
                              }`}
                            >
                              {presence.status === "masuk"
                                ? "Check-in"
                                : presence.status === "pulang"
                                ? "Check-out"
                                : "Belum hadir"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {presence.checkInTime &&
                        presence.status === "pulang" ? (
                          <div className="text-right">
                            <div className="text-xs text-green-600">
                              In: {presence.checkInTime}
                            </div>
                            <div className="text-xs text-blue-600">
                              Out:{" "}
                              {presence.checkOutTime ||
                                formatTime(presence.time)}
                            </div>
                          </div>
                        ) : (
                          formatTime(presence.time)
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:py-0">
        <div className="w-full px-4 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} RFID Attendance System. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="text-sm underline underline-offset-4"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Utils
function formatDateISO(date: Date): string {
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
