import { TabsContent } from "@/components/ui/tabs";
import { QuickStatsCard } from "./quick-stats-card";
import { UseDashboardPage } from "../../use-dashboard-page";
import { ChartSection } from "./chart-section";
import { RecentAttendance } from "./recent-attendance";

export function OverviewTab() {
  const {
    avgArrivalTime,
    mostActiveDay,
    presentPercentage,
    presentToday,
    totalLecturers,
    pieChartData,
    todayFormatted,
    weeklyData,
    todayPresence,
  } = UseDashboardPage();

  return (
    <TabsContent value="overview" className="space-y-6">
      {/* Quick Stats Cards */}
      <QuickStatsCard
        avgArrivalTime={avgArrivalTime}
        mostActiveDay={mostActiveDay}
        presentPercentage={presentPercentage}
        presentToday={presentToday}
        totalLecturers={totalLecturers}
      />

      {/* Charts Section */}
      <ChartSection
        pieChartData={pieChartData}
        todayFormatted={todayFormatted}
        weeklyData={weeklyData}
      />

      {/* Recent Attendance */}
      <RecentAttendance todayPresence={todayPresence} />
    </TabsContent>
  );
}
