import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardPage } from "../../use-dashboard-page";

interface RecentAttendance {
    todayPresence: any[]
}

export function RecentAttendance({ todayPresence }: RecentAttendance) {

    const { formatTime } = useDashboardPage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kehadiran Terbaru</CardTitle>
        <CardDescription>
          Daftar dosen yang terakhir melakukan presensi hari ini
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todayPresence.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Belum ada kehadiran hari ini
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {todayPresence.slice(0, 5).map((item, key) => (
              <div className="flex items-center" key={key}>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {item.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.lecturerCode}
                  </p>
                </div>
                <div className="ml-auto font-medium">
                  {formatTime(item.time)} WIB
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {todayPresence.length > 5 && (
        <CardFooter>
          <Button variant="outline" size="sm" className="w-full">
            Lihat Semua ({todayPresence.length})
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
