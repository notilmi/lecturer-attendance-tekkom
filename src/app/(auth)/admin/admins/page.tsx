"use client";

import { Button } from "@/components/ui/button";
import { Header } from "../_components/header";
import { AdminTable } from "./_components/admin-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddAdminDialog from "./_components/add-dialog";
import EditAdminDialog from "./_components/edit-dialog";

interface Admin {
    id: string;
    email: string;
    createdAt: string;
  }

export default function Admin() {
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  return (
    <div className="p-4">
      <Header title="Kelola Admin" />
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          <Button onClick={() => setAddAdminOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Admin
          </Button>
        </div>
      </div>
      <AdminTable />
      <AddAdminDialog open={addAdminOpen} onOpenChange={setAddAdminOpen} />
      {/* <EditAdminDialog
        admin={editingAdmin!}
        open={!!editingAdmin}
        onOpenChange={(open) => !open && setEditingAdmin(null)}
      />{" "} */}
    </div>
  );
}
