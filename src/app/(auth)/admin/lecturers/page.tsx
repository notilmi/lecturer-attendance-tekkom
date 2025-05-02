"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Header } from "../_components/header";
import { UseLecturePage } from "./use-lecture-page";
import { AddDialog } from "./_components/add-dialog";
import { EditDialog } from "./_components/edit-dialog";
import { DeleteDialog } from "./_components/delete-dialog";
import { LecturerTable } from "./_components/lecturer-table";

export default function LecturersPage() {
  const {
    searchQuery,
    setSearchQuery,
    isLoading,
    selectedLecturer,
    setSelectedLecturer,
    showDeleteDialog,
    setShowDeleteDialog,
    showEditDialog,
    setShowEditDialog,
    showAddDialog,
    setShowAddDialog,
    isDeleting,
    filteredLecturers,
    handleDeleteLecturer,
  } = UseLecturePage();

  return (
    <div className="p-4">
      <Header title="Kelola Dosen" />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Dosen
        </Button>
      </div>

      <LecturerTable
        filteredLecturers={filteredLecturers}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedLecturer={setSelectedLecturer}
        setShowDeleteDialog={setShowDeleteDialog}
        setShowEditDialog={setShowEditDialog}
      />

      <AddDialog
        showAddDialog={showAddDialog}
        setShowAddDialog={setShowAddDialog}
      />

      <EditDialog
        showEditDialog={showEditDialog}
        setShowEditDialog={setShowEditDialog}
        selectedLecturer={selectedLecturer}
        setSelectedLecturer={setSelectedLecturer}
      />

      <DeleteDialog
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        handleDeleteLecturer={handleDeleteLecturer}
        isDeleting={isDeleting}
        selectedLecturer={selectedLecturer}
        setSelectedLecturer={setSelectedLecturer}
      />
    </div>
  );
}
