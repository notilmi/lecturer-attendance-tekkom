"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lecturer } from "@/lib/schema/lecturer";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  formData: Partial<Lecturer & { id?: string }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export const FormDialog = ({
  open,
  onOpenChange,
  formData,
  onChange,
  onSubmit,
}: FormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formData.id ? "Edit Dosen" : "Tambah Dosen"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            name="name"
            placeholder="Nama"
            value={formData.name || ""}
            onChange={onChange}
          />
          <Input
            name="lecturerCode"
            placeholder="Kode Dosen"
            value={formData.lecturerCode || ""}
            onChange={onChange}
          />
          <Input
            name="rfidUid"
            placeholder="RFID UID"
            value={formData.rfidUid || ""}
            onChange={onChange}
          />
          <Input
            name="status"
            placeholder="Status (hadir/tidak)"
            value={formData.status || ""}
            onChange={onChange}
          />
          <Button className="w-full" onClick={onSubmit}>
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
