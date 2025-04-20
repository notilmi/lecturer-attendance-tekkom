"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { UseAttendancePage } from "../../use-attendance-page";

export function SummaryAttendance() {
  const { selectedDate, attendanceData, summary, isLoadingData } =
    UseAttendancePage();

  return !selectedDate || attendanceData.length === 0 ? (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {!selectedDate
          ? "Pilih tanggal terlebih dahulu."
          : "Tidak ada data kehadiran untuk tanggal ini."}
      </AlertDescription>
    </Alert>
  ) : isLoadingData ? (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  ) : (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Kehadiran</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.total}</div>
          <p className="text-xs text-muted-foreground">
            Jumlah dosen yang hadir
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Hadir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.present}</div>
          <p className="text-xs text-muted-foreground">Status hadir</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Sesuai Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.scheduled}</div>
          <p className="text-xs text-muted-foreground">
            Kehadiran sesuai jadwal
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Di Luar Jadwal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{summary.unscheduled}</div>
          <p className="text-xs text-muted-foreground">
            Kehadiran di luar jadwal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
