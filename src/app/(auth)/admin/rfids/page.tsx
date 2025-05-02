"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ref, get, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  Plus,
} from "lucide-react";
import { RfidTag } from "@/lib/schema/rfid";
import { UseRfidPage } from "./use-rfid-page";
import { AddDialog } from "./_components/add-dialog";
import { DeleteDialog } from "./_components/delete-dialog";
import { RfidTable } from "./_components/rfid-table";
import { Header } from "../_components/header";

export default function RfidManagementPage() {

  const {
    rfidTags,
    setRfidTags,
    setLecturers,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsRefreshing,
    selectedTag,
    setSelectedTag,
    showDeleteDialog,
    setShowDeleteDialog,
    showAddDialog,
    setShowAddDialog,
    newRfidUid,
    setNewRfidUid,
    isDeleting,
    isAdding,
    filteredTags,
    isValidRfidUid,
    handleAddRfid,
    handleDeleteRfid,
  } = UseRfidPage();

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const rfidRef = ref(database, "rfid_register");
      const rfidSnapshot = await get(rfidRef);

      const lecturersRef = ref(database, "lecturers");
      const lecturersSnapshot = await get(lecturersRef);

      let lecturersData: any[] = [];
      if (lecturersSnapshot.exists()) {
        const data = lecturersSnapshot.val();
        lecturersData = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setLecturers(lecturersData);
      }

      if (rfidSnapshot.exists()) {
        const data = rfidSnapshot.val();
        const formattedData: RfidTag[] = Object.keys(data).map((key) => ({
          uid: key,
          value: data[key],
        }));

        // Check if each RFID is assigned to a lecturer
        formattedData.forEach((tag) => {
          const assignedLecturer = lecturersData.find(
            (lecturer) => lecturer.rfidUid === tag.uid
          );
          if (assignedLecturer) {
            tag.isAssigned = true;
            tag.assignedTo = {
              id: assignedLecturer.id,
              name: assignedLecturer.name,
            };
          } else {
            tag.isAssigned = false;
          }
        });

        setRfidTags(formattedData);
      } else {
        setRfidTags([]);
      }

      toast("Berhasil", {
        description: "Data RFID berhasil diperbarui.",
      });
    } catch (error: any) {
      console.error("Error refreshing data:", error);
      toast("Error", {
        description: `Gagal memperbarui data: ${error.message}`,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-4">
      <Header title="Kelola RFID" />
      <div className="flex items-center justify-end mb-6">
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah RFID
          </Button>
        </div>
      </div>

      <RfidTable
        filteredTags={filteredTags}
        isLoading={isLoading}
        rfidTags={rfidTags}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedTag={setSelectedTag}
        setShowDeleteDialog={setShowDeleteDialog}
      />

      <AddDialog
        handleAddRfid={handleAddRfid}
        isAdding={isAdding}
        isValidRfidUid={isValidRfidUid}
        newRfidUid={newRfidUid}
        setNewRfidUid={setNewRfidUid}
        setShowAddDialog={setShowAddDialog}
        showAddDialog={showAddDialog}
      />

      <DeleteDialog
        handleDeleteRfid={handleDeleteRfid}
        isDeleting={isDeleting}
        setShowDeleteDialog={setShowDeleteDialog}
        showDeleteDialog={showDeleteDialog}
        selectedTag={selectedTag}
      />
    </div>
  );
}
