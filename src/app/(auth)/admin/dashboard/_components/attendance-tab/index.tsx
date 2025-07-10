import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useDashboardPage } from "../../use-dashboard-page";
import { LecturesArrivalGraphic } from "./lectures-arrival-graphic";
import { LecturesPresenceStats } from "./lectures-presence-stats";

export function AttendanceTab() {
  const {
    arrivalDistribution,
    isLoading,
    formatTime,
    todayPresence,
    lecturers,
  } = useDashboardPage();

  return (
    <TabsContent value="attendance" className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <LecturesArrivalGraphic arrivalDistribution={arrivalDistribution} />

        <LecturesPresenceStats
          isLoading={isLoading}
          formatTime={formatTime}
          todayPresence={todayPresence}
          lecturers={lecturers}
        />
      </div>
    </TabsContent>
  );
}
