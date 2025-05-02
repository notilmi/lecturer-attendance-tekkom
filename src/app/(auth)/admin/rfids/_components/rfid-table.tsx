"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Search, Trash2, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { RfidTag } from "@/lib/schema/rfid";

export function RfidTable({
  rfidTags,
  searchQuery,
  setSearchQuery,
  isLoading,
  setSelectedTag,
  setShowDeleteDialog,
  filteredTags,
}: {
  rfidTags: RfidTag[],
  searchQuery: string,
  setSearchQuery: (value: string) => void,
  isLoading: boolean,
  setSelectedTag: (value: RfidTag) => void,
  setShowDeleteDialog: (open: boolean) => void,
  filteredTags: RfidTag[],
}) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Tag RFID</CardTitle>
        <CardDescription>
          Kelola tag RFID yang terdaftar dalam sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari RFID..."
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
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTags.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {searchQuery
                ? `Tidak ada hasil untuk "${searchQuery}"`
                : "Belum ada tag RFID yang terdaftar"}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFID UID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dosen Terkait</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTags.map((tag) => (
                  <TableRow key={tag.uid}>
                    <TableCell className="font-mono">{tag.uid}</TableCell>
                    <TableCell>
                      <Badge variant={tag.isAssigned ? "default" : "secondary"}>
                        {tag.isAssigned ? "Digunakan" : "Tidak Digunakan"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tag.isAssigned && tag.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <span>{tag.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500"
                        onClick={() => {
                          setSelectedTag(tag);
                          setShowDeleteDialog(true);
                        }}
                        disabled={tag.isAssigned}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="mt-4 text-sm text-muted-foreground">
          Total RFID: {rfidTags.length} | Digunakan:{" "}
          {rfidTags.filter((tag) => tag.isAssigned).length} | Tersedia:{" "}
          {rfidTags.filter((tag) => !tag.isAssigned).length}
        </div>
      </CardContent>
    </Card>
  );
}
