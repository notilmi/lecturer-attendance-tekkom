import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface LecturesPresenceStatsProps {
    isLoading: boolean,
    lecturers: any[],
    todayPresence: any,
    formatTime: (timestamp: number) => void
}

export function LecturesPresenceStats({ isLoading, lecturers, todayPresence, formatTime }: LecturesPresenceStatsProps) {
    
  
    return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Status Kehadiran per Dosen</CardTitle>
        <CardDescription>
          Daftar lengkap dosen dan status kehadirannya
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : lecturers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">Belum ada data dosen</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm">
              <div className="col-span-5 sm:col-span-5">Nama</div>
              <div className="col-span-3 sm:col-span-3">Kode</div>
              <div className="col-span-4 sm:col-span-2 text-right">Status</div>
              <div className="hidden sm:block sm:col-span-2 text-right">
                Waktu
              </div>
            </div>
            <div className="max-h-[400px] overflow-auto">
              {lecturers.map((lecturer) => {
                // Find matching presence data if any
                const presenceData = todayPresence.find(
                  (p: any) => p.id === lecturer.id
                );

                return (
                  <div
                    key={lecturer.id}
                    className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50"
                  >
                    <div className="col-span-5 sm:col-span-5 font-medium truncate">
                      {lecturer.name}
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-sm">
                      {lecturer.lecturerCode}
                    </div>
                    <div className="col-span-4 sm:col-span-2 text-right">
                      <Badge>
                        {/* variant={lecturer.status === 'hadir' ? 'success' : 'secondary'} */}
                        {lecturer.status === "hadir" ? "Hadir" : "Tidak Hadir"}
                      </Badge>
                    </div>
                    <div className="hidden sm:block sm:col-span-2 text-right text-sm text-muted-foreground">
                      {presenceData
                        ? formatTime(presenceData.time) + " WIB"
                        : "-"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
