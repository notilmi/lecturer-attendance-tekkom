import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LecturerForm } from "./form-dialog";
import { Lecturer } from "@/lib/schema/lecturer";

export function AddDialog({
  showAddDialog,
  setShowAddDialog,
  updateLecturerList
}: {
  showAddDialog: boolean;
  setShowAddDialog: (value: boolean) => void;
  updateLecturerList: (lecturer: Lecturer) => void
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
          }}
          updateLecturerList={updateLecturerList}
        />
      </DialogContent>
    </Dialog>
  );
}
