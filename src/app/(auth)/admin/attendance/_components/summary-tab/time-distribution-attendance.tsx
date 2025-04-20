import { UseAttendancePage } from "../../use-attendance-page";

export function TimeDistributionAttendance() {
  const { selectedDate, attendanceData, summary, isLoadingData } =
    UseAttendancePage();
  return (
    selectedDate &&
    attendanceData.length > 0 && (
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">
          Distribusi Waktu Kehadiran
        </h3>

        <div className="relative h-40 w-full">
          {/* Simple bar chart showing arrival time distribution */}
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between h-32">
            {(() => {
              // Group attendance by hour
              const hourGroups: { [key: string]: number } = {};
              attendanceData.forEach((record) => {
                const hour = new Date(record.time).getHours();
                const hourKey = `${hour}:00`;
                hourGroups[hourKey] = (hourGroups[hourKey] || 0) + 1;
              });

              // Find max count for scaling
              const maxCount = Math.max(...Object.values(hourGroups));

              // Sort hours
              const sortedHours = Object.keys(hourGroups).sort();

              return sortedHours.map((hour) => {
                const count = hourGroups[hour];
                const height = Math.max((count / maxCount) * 100, 10); // At least 10% height

                return (
                  <div
                    key={hour}
                    className="flex flex-col items-center"
                    style={{ width: `${100 / sortedHours.length}%` }}
                  >
                    <div
                      className="w-full mx-1 bg-primary/80 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                    <div className="mt-2 text-xs font-medium">{hour}</div>
                    <div className="text-xs text-muted-foreground">
                      {count} dosen
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    )
  );
}
