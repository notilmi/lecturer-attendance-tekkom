import { useCallback, useEffect, useMemo, useState } from "react";
import { Lecturer, lecturerSchema } from "@/lib/schema/lecturer";
import { z } from "zod";
import { database } from "@/lib/firebase";
import { get, ref, remove } from "firebase/database";
import { toast } from "sonner";

export function UseLecturePage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchLecturers = async () => {
      try {
        setIsLoading(true);
        const lecturersRef = ref(database, "lecturers");
        const snapshot = await get(lecturersRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const formattedData = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
            teachingDays: data[key].teachingDays || [],
          }));

          // Sort by name
          formattedData.sort((a, b) => a.name.localeCompare(b.name));
          setLecturers(formattedData);
        } else {
          setLecturers([]);
        }
      } catch (error) {
        console.error("Error fetching lecturers:", error);
        toast("Error", {
          description: "Gagal memuat data dosen.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLecturers();
  }, [toast]);

  const filteredLecturers = lecturers.filter(
    (lecturer) =>
      lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecturer.lecturerCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteLecturer = async () => {
    if (!selectedLecturer) return;

    setIsDeleting(true);
    try {
      const lecturerRef = ref(database, `lecturers/${selectedLecturer.id}`);

      await remove(lecturerRef);

      toast("Berhasil", {
        description: `Data dosen ${selectedLecturer.name} berhasil dihapus.`,
      });

      setLecturers((prev) => prev.filter((l) => l.id !== selectedLecturer.id));
      setShowDeleteDialog(false);
      setSelectedLecturer(null);
    } catch (error: any) {
      console.error("Error deleting lecturer:", error);
      toast("Error", {
        description: `Gagal menghapus data: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    lecturers,
    setLecturers,
    searchQuery,
    setSearchQuery,
    isLoading, 
    setIsLoading,
    selectedLecturer, 
    setSelectedLecturer,
    showDeleteDialog, 
    setShowDeleteDialog,
    showEditDialog, 
    setShowEditDialog, 
    showAddDialog, 
    setShowAddDialog, 
    isDeleting, 
    setIsDeleting,
    filteredLecturers,
    handleDeleteLecturer
  }
}