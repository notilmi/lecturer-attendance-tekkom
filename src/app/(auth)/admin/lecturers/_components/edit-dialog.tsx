import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from "@/components/ui/dialog";
  import { LecturerForm } from "./form-dialog";
import { Lecturer } from "@/lib/schema/lecturer";

export function EditDialog({
    showEditDialog,
    setShowEditDialog,
    selectedLecturer,
    setSelectedLecturer
}: {
    showEditDialog: boolean,
    setShowEditDialog: (value: boolean) => void,
    selectedLecturer: Lecturer | null,
    setSelectedLecturer: (value: Lecturer | null) => void 
}) {
    return (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Dosen</DialogTitle>
            <DialogDescription>Perbarui informasi dosen</DialogDescription>
          </DialogHeader>
          {selectedLecturer && (
            <LecturerForm
              initialData={selectedLecturer}
              onSuccess={() => {
                setShowEditDialog(false);
                setSelectedLecturer(null);
                // Refresh the list after editing
                window.location.reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    )
}