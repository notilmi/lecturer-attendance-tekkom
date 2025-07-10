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
import { formatDaysList } from "../utils/format-dat-list";
import { Lecturer } from "@/lib/schema/lecturer";
import { Admin } from "@/lib/schema/admin";

export function AdminTable({
    searchQuery,
    setSearchQuery,
    isLoading, 
    filteredAdmins,
    setSelectedAdmin,
    setShowDeleteDialog,
    setShowEditDialog
}: {
    searchQuery: string,
    setSearchQuery: (value: string) => void,
    isLoading: boolean, 
    filteredAdmins: Admin[],
    setSelectedAdmin: (value: Admin) => void,
    setShowDeleteDialog: (value: boolean) => void,
    setShowEditDialog: (value: boolean) => void
}) {
    return (
        <Card className="mb-6">
        <CardHeader>
          <CardTitle>Daftar Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari admin..."
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
          ) : filteredAdmins.length === 0 ? (
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
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.email}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setShowEditDialog(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button> */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => {
                              setSelectedAdmin(admin);
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
    )
}