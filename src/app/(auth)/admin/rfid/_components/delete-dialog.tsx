"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RfidTag } from "@/lib/schema/rfid";

export function DeleteDialog({
  showDeleteDialog,
  setShowDeleteDialog,
  isDeleting,
  handleDeleteRfid,
  selectedTag
}: {
    showDeleteDialog: boolean,
    setShowDeleteDialog: (open: boolean) => void,
    isDeleting: boolean,
    handleDeleteRfid: () => Promise<void>
    selectedTag: RfidTag | null
}) {

  return (
    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Konfirmasi Hapus</DialogTitle>
        <DialogDescription>
          Apakah Anda yakin ingin menghapus RFID dengan UID <span className="font-mono font-medium">{selectedTag?.uid}</span>?
          {selectedTag?.isAssigned && (
            <Alert className="mt-2" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                RFID ini sedang digunakan oleh {selectedTag?.assignedTo?.name}. Anda perlu melepaskan asosiasi terlebih dahulu.
              </AlertDescription>
            </Alert>
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
          Batal
        </Button>
        <Button 
          variant="destructive" 
          onClick={handleDeleteRfid}
          disabled={isDeleting || (selectedTag?.isAssigned ?? false)}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menghapus...
            </>
          ) : 'Hapus'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  );
}
