import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { LecturerForm } from "./form-dialog";

export function AddDialog({
  showAddDialog,
  setShowAddDialog,
}: {
  showAddDialog: boolean;
  setShowAddDialog: (value: boolean) => void;
}) {
  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Dosen Baru</DialogTitle>
          <DialogDescription>
            Masukkan data dosen baru dan kaitkan dengan RFID
          </DialogDescription>
        </DialogHeader>
        <LecturerForm
          onSuccess={() => {
            setShowAddDialog(false);
            // Refresh the list after adding
            window.location.reload();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
