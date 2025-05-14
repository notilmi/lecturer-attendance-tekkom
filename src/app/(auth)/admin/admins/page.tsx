"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Header } from "../_components/header";
import { AddDialog } from "./_components/add-dialog";
import { EditDialog } from "./_components/edit-dialog";
import { DeleteDialog } from "./_components/delete-dialog";
import { UseAdminPage } from "./use-admin-page";
import { AdminTable } from "./_components/admin-table";

export default function LecturersPage() {
  const {
    admins,
    setAdmins,
    searchQuery,
    setSearchQuery,
    isLoading, 
    setIsLoading,
    selectedAdmin, 
    setSelectedAdmin,
    showDeleteDialog, 
    setShowDeleteDialog,
    showEditDialog, 
    setShowEditDialog, 
    showAddDialog, 
    setShowAddDialog, 
    isDeleting, 
    setIsDeleting,
    filteredLecturers,
    handleDeleteAdmin,
    updateAdminList
  } = UseAdminPage();

  return (
    <div className="p-4">
      <Header title="Kelola Admin" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Admin
        </Button>
      </div>

      <AdminTable
        filteredAdmins={filteredLecturers}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedAdmin={setSelectedAdmin}
        setShowDeleteDialog={setShowDeleteDialog}
        setShowEditDialog={setShowEditDialog}
      />

      <AddDialog
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
        updateAdminList={updateAdminList}
      />

      <EditDialog
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        selectedAdmin={selectedAdmin}
        setSelectedAdmin={setSelectedAdmin}
        updateAdminList={updateAdminList}
      />

      <DeleteDialog
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteAdmin={handleDeleteAdmin}
        isDeleting={isDeleting}
        selectedAdmin={selectedAdmin}
        setSelectedAdmin={setSelectedAdmin}
      />
    </div>
  );
}
