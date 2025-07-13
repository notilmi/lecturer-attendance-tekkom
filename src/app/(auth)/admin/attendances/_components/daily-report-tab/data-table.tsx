"use client";

import { LecturePresence } from "@/lib/schema/lecture-presence";
import { formatTime } from "../../utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DataTableProps {
  data: LecturePresence[];
  isDeleting: boolean;
  onDelete: (record: LecturePresence) => void;
  getStatusDisplay: (status: string) => string;
}

export function DataTable({ data, isDeleting, onDelete, getStatusDisplay }: DataTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Kode</TableHead>
            <TableHead>Waktu</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Jadwal</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record) => (
            <TableRow key={record.lecturerId}>
              <TableCell className="font-medium">{record.name}</TableCell>
              <TableCell>{record.lecturerCode}</TableCell>
              <TableCell>{formatTime(record.time)} WIB</TableCell>
              <TableCell>
                <Badge variant={record.status === "hadir" ? "default" : "secondary"}>
                  {getStatusDisplay(record.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {record.isScheduled !== undefined && (
                  <Badge variant={record.isScheduled ? "default" : "outline"}>
                    {record.isScheduled ? "Sesuai Jadwal" : "Di Luar Jadwal"}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={() => onDelete(record)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus data kehadiran {record.name}?
                        Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(record)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menghapus...
                          </>
                        ) : (
                          "Hapus"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}