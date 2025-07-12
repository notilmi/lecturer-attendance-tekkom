"use client";

import React from "react";
import { Tabs } from "@/components/ui/tabs";
import { Header } from "../_components/header";
import { TabList } from "./_components/tab-list";
import { SummaryTab } from "./_components/summary-tab";
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
import { AlertCircle, Calendar, Download, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "./utils";
import HeaderTable from "./_components/header-table";
import { DataTable } from "./_components/daily-report-tab/data-table";
import { useAttendancePage } from "./use-attendance-page";

export default function AttendanceReportPage() {
  const {
    dates,
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    isLoadingDates,
    isLoadingData,
    selectedRecord,
    setSelectedRecord,
    isDeleting,
    filteredAttendance,
    summary,
    handleDeleteRecord,
    exportToCSV,
    getStatusDisplay,
  } = useAttendancePage();

  const [activeTab, setActiveTab] = React.useState("daily");

  return (
    <div className="p-4">
      <Header title="Laporan Kehadiran" />

      <Tabs
        defaultValue="daily"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabList />

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

            {selectedDate && filteredAttendance.length > 0 && (
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
                ) : filteredAttendance.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {searchQuery
                        ? `Tidak ada hasil yang cocok dengan pencarian "${searchQuery}".`
                        : "Tidak ada data kehadiran untuk tanggal ini."}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <DataTable
                    data={filteredAttendance}
                    isDeleting={isDeleting}
                    onDelete={(record) => {
                      setSelectedRecord(record);
                      handleDeleteRecord();
                    }}
                    getStatusDisplay={getStatusDisplay}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* <TabsContent value="summary" className="space-y-6">
          {selectedDate && (
            <SummaryTab selectedDate={selectedDate} summary={summary} />
          )}
        </TabsContent> */}
      </Tabs>
    </div>
  );
}