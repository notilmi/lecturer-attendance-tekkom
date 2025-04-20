"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TabsContent } from "@/components/ui/tabs";
import {
  AlertCircle,
  Calendar,
  Download,
  Search,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "../../utils";
import { UseAttendancePage } from "../../use-attendance-page";
import HeaderTable from "../header-table";
import { DataTable } from "./data-table";

export function DailyReportTab() {
  const {
    isLoadingDates,
    dates,
    selectedDate,
    setSelectedDate,
    attendanceData,
    filteredAttendance,
    searchQuery,
    exportToCSV,
    setSearchQuery,
    isLoadingData,
  } = UseAttendancePage();

  return (
    <TabsContent value="daily" className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Pilih Tanggal:</span>
        </div>

        {isLoadingDates ? (
          <Skeleton className="h-10 w-48" />
        ) : dates.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Belum ada data kehadiran.
          </div>
        ) : (
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-full sm:w-[250px]">
              <SelectValue placeholder="Pilih tanggal" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {formatDate(date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedDate && attendanceData.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {selectedDate && (
        <Card>
          <HeaderTable
            selectedDate={selectedDate}
            filteredAttendance={filteredAttendance}
          />
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari dosen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {isLoadingData ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center p-4 border rounded-md"
                  >
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : attendanceData.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada data kehadiran untuk tanggal ini.
                </AlertDescription>
              </Alert>
            ) : filteredAttendance.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Tidak ada hasil yang cocok dengan pencarian "{searchQuery}
                  ".
                </AlertDescription>
              </Alert>
            ) : (
              <DataTable />
            )}
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
