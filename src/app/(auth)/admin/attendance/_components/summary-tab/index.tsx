"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { formatDate } from "../../utils";
import { UseAttendancePage } from "../../use-attendance-page";
import { TimeDistributionAttendance } from "./time-distribution-attendance";

export function SummaryTab() {
  const { selectedDate } =
    UseAttendancePage();

  return (
    <TabsContent value="summary">
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Kehadiran</CardTitle>
          <CardDescription>
            {selectedDate
              ? formatDate(selectedDate)
              : "Pilih tanggal untuk melihat ringkasan"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SummaryTab/>
          <TimeDistributionAttendance/>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
