"use client";

import React from "react";
import { Tabs } from "@/components/ui/tabs";
import { Header } from "../_components/header";
import { useAttendancePage } from "./use-attendance-page";
import { TabList } from "./_components/tab-list";
import { DailyReportTab } from "./_components/daily-report-tab";
import { SummaryTab } from "./_components/summary-tab";

export default function AttendanceReportPage() {
  const {
    activeTab,
    setActiveTab,
  } = useAttendancePage();

  return (
    <div className="p-4">
      <Header title="Laporan Kehadiran" />

      <Tabs
        defaultValue="daily"
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        {/* <TabList /> */}

        {/* Daily Report Tab */}
        <DailyReportTab />

        {/* Summary Tab */}
        {/* <SummaryTab /> */}
      </Tabs>
    </div>
  );
}
