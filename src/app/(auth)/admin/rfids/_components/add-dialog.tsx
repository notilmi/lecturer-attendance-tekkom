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
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UseRfidPage } from "../use-rfid-page";

export function AddDialog({
  showAddDialog,
  setShowAddDialog,
  newRfidUid,
  setNewRfidUid,
  isAdding,
  isValidRfidUid,
  handleAddRfid
}: {
    showAddDialog: boolean,
    setShowAddDialog: (open: boolean) => void,
    newRfidUid: string,
    setNewRfidUid: (value: string) => void,
    isAdding: boolean,
    isValidRfidUid: (uid: string) => boolean,
    handleAddRfid: () => Promise<void>
}) {

  return (
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Tag RFID</DialogTitle>
          <DialogDescription>
            Masukkan UID RFID yang ingin didaftarkan ke sistem
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Masukkan RFID UID"
              value={newRfidUid}
              onChange={(e) => setNewRfidUid(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Format: Karakter alfanumerik, tanpa spasi atau karakter khusus
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddDialog(false)}>
            Batal
          </Button>
          <Button
            onClick={handleAddRfid}
            disabled={isAdding || !newRfidUid || !isValidRfidUid(newRfidUid)}
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Tambahkan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
