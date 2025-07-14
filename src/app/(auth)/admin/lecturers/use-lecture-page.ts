import { useCallback, useEffect, useMemo, useState } from "react";
import { Lecturer, lecturerSchema } from "@/lib/schema/lecturer";
import { z } from "zod";
import { database } from "@/lib/firebase";
import { get, onValue, ref, remove, off } from "firebase/database";
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
    const lecturersRef = ref(database, "lecturers");
    const fetchLecturers = async () => {
      try {
        setIsLoading(true);
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

    onValue(lecturersRef, fetchLecturers, (error) => {
      console.error("Error fetching lecturers:", error);
      toast("Error", {
        description: "Gagal memuat data dosen.",
      });
      setIsLoading(false);
    });

    return () => {
      off(lecturersRef)
    }
  }, []);

  const filteredLecturers =
    lecturers.filter(
      (lecturer) =>
        lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lecturer.lecturerCode.toLowerCase().includes(searchQuery.toLowerCase())
    ).reverse();



  const updateLectureList = useCallback((lecturer: Lecturer) => {
    setLecturers((prev) => {
      const index = prev.findIndex((l) => l.id === lecturer.id);
      if (index >= 0) {
        // Update existing lecturer
        const updated = [...prev];
        updated[index] = lecturer;
        return updated;
      }
      // Add new lecturer
      const newList = [...prev, lecturer];
      // Sort by name
      newList.sort((a, b) => a.name.localeCompare(b.name));
      return newList;
    })
  }, [])

  const handleDeleteLecturer = useCallback(async () => {
    if (!selectedLecturer) return;

    setShowDeleteDialog(false);
    setSelectedLecturer(null);
    setIsDeleting(true);

    try {
      const lecturerRef = ref(database, `lecturers/${selectedLecturer.id}`);
      await remove(lecturerRef);

      toast("Berhasil", {
        description: `Data dosen ${selectedLecturer.name} berhasil dihapus.`,
      });

      setLecturers((prev) => prev.filter((l) => l.id !== selectedLecturer.id));

    } catch (error: any) {
      console.error("Error deleting lecturer:", error);
      toast("Error", {
        description: `Gagal menghapus data: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }

  }, [selectedLecturer]);

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
    handleDeleteLecturer,
    updateLectureList
  }
}