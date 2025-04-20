import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "../utils";
import { LecturePresence } from "@/lib/schema/lecture-presence";

export default function HeaderTable({
  selectedDate,
  filteredAttendance,
}: {
  selectedDate: string;
  filteredAttendance: LecturePresence[];
}) {
  return (
    <CardHeader>
      <CardTitle>Kehadiran {formatDate(selectedDate)}</CardTitle>
      <CardDescription>
        Total: {filteredAttendance.length} dosen
      </CardDescription>
    </CardHeader>
  );
}
