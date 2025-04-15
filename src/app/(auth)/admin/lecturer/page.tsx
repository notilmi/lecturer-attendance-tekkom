"use client"

import { Loader2, PlusCircle } from "lucide-react";
import { DataTable } from "../_components/data-table";
import { Button } from "@/components/ui/button";
import { FormDialog } from "./_components/form-dialog";
import { ConfirmDialog } from "@/app/(auth)/admin/_components/confirm-dialog";
import { UseLecturePage } from "./use-lecture-page";

export default function lecturer() {
  const {
    columns,
    data,
    loading,
    setOpenForm,
    openForm,
    handleChange,
    handleSubmit,
    formData,
    setOpenConfirm,
    openConfirm,
    handleDelete,
  } = UseLecturePage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-6 h-6" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold mb-4">Data Dosen</h1>
        <Button onClick={() => setOpenForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Dosen
        </Button>
      </div>
      <DataTable columns={columns} data={data} />

      <FormDialog
        open={openForm}
        onOpenChange={setOpenForm}
        formData={formData}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={openConfirm}
        onOpenChange={setOpenConfirm}
        onConfirm={handleDelete}
      />
    </div>
  );
}
