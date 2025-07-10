import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
import { Admin } from "@/lib/schema/admin";
import { Lecturer } from "@/lib/schema/lecturer";
import { Loader2 } from "lucide-react";

export function DeleteDialog({
    showDeleteDialog,
    setShowDeleteDialog,
    selectedAdmin,
    handleDeleteAdmin,
    isDeleting,
}: {
    showDeleteDialog: boolean,
    setShowDeleteDialog: (value: boolean) => void,
    selectedAdmin: Admin | null,
    setSelectedAdmin: (value: Admin | null) => void,
    handleDeleteAdmin: () => Promise<void>,
    isDeleting: boolean,
}) {
    return (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus data admin{" "}
              {selectedAdmin?.email}? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAdmin}
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
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
}