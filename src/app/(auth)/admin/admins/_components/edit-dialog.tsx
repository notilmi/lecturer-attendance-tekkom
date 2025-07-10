"use client";

import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, update } from "firebase/database";
import { Admin, adminSchema } from "@/lib/schema/admin";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { AdminForm } from "./form-dialog";

export function EditDialog({
  showEditDialog,
  setShowEditDialog,
  selectedAdmin,
  setSelectedAdmin,
  updateAdminList,
}: {
  showEditDialog: boolean;
  setShowEditDialog: (value: boolean) => void;
  selectedAdmin: Admin | null;
  setSelectedAdmin: (value: Admin | null) => void;
  updateAdminList: (lecturer: Admin) => void;
}) {

  return (
    <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Data Admin</DialogTitle>
          <DialogDescription>Perbarui informasi Admin</DialogDescription>
        </DialogHeader>
        {selectedAdmin && (
          <AdminForm
            initialData={selectedAdmin}
            onSuccess={() => {
              setShowEditDialog(false);
              setSelectedAdmin(null);
              // Refresh the list after editing
            }}
            updateAdminList={updateAdminList}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
