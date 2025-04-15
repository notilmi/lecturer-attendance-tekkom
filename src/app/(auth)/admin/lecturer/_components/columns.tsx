"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Lecturer } from "@/lib/schema/lecturer";
import { Pencil, Trash2 } from "lucide-react";

export const useLectureColumn = (
  onEdit?: (Lecturer: Lecturer & { id: string }) => void,
  onDelete?: (id: string) => void
): ColumnDef<Lecturer & { id: string }>[] => {
  return [
    {
      accessorKey: "name",
      header: "Nama",
    },
    {
      accessorKey: "lecturerCode",
      header: "Kode Dosen",
    },
    {
      accessorKey: "rfidUid",
      header: "RFID UID",
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const lecturer = row.original;

        return (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(lecturer)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete?.(lecturer.id)}
              className="text-red-600 hover:text-red-800"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];
};
