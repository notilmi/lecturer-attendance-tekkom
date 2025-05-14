import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminForm } from "./form-dialog";
import { Lecturer } from "@/lib/schema/lecturer";
import { Admin } from "@/lib/schema/admin";

export function AddDialog({
  showAddDialog,
  setShowAddDialog,
  updateAdminList
}: {
  showAddDialog: boolean;
  setShowAddDialog: (value: boolean) => void;
  updateAdminList: (admin: Admin) => void
}) {
  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Admin Baru</DialogTitle>
          <DialogDescription>
            Masukkan data admin baru
          </DialogDescription>
        </DialogHeader>
        <AdminForm
          onSuccess={() => {
            setShowAddDialog(false);
          }}
          updateAdminList={updateAdminList}
        />
      </DialogContent>
    </Dialog>
  );
}
