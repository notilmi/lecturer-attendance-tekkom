import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDaysList } from "../utils/format-day-list";
import { Lecturer } from "@/lib/schema/lecturer";

export function LecturerTable({
  searchQuery,
  setSearchQuery,
  isLoading,
  filteredLecturers,
  setSelectedLecturer,
  setShowDeleteDialog,
  setShowEditDialog,
}: {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  isLoading: boolean;
  filteredLecturers: Lecturer[];
  setSelectedLecturer: (value: Lecturer) => void;
  setShowDeleteDialog: (value: boolean) => void;
  setShowEditDialog: (value: boolean) => void;
}) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Daftar Dosen</CardTitle>
      </CardHeader>
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

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 border rounded-md"
              >
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLecturers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : "Belum ada data dosen"}
            </p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>RFID UID</TableHead>
                  <TableHead>Jadwal Mengajar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLecturers.map((lecturer) => (
                  <TableRow key={lecturer.id}>
                    <TableCell className="font-medium">
                      {lecturer.name}
                    </TableCell>
                    <TableCell>{lecturer.lecturerCode}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {lecturer.rfidUid}
                    </TableCell>
                    <TableCell>
                      {formatDaysList(lecturer.teachingDays)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lecturer.status === "masuk"
                            ? "default"
                            : lecturer.status === "pulang"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {lecturer.status === "masuk"
                          ? "Hadir"
                          : lecturer.status === "pulang"
                          ? "Sudah Pulang"
                          : "Belum Hadir"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLecturer(lecturer);
                            setShowEditDialog(true);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => {
                            setSelectedLecturer(lecturer);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
