import { useCallback, useEffect, useMemo, useState } from "react";
import { lecturerSchema } from "@/lib/schema/lecturer";
import { z } from "zod";
import { database } from "@/lib/firebase";
import { get, onValue, ref, remove, off } from "firebase/database";
import { toast } from "sonner";
import { Admin } from "@/lib/schema/admin";
import { useAuth } from "@/contexts/auth-context";

export function UseAdminPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();


  useEffect(() => {
    const adminsRef = ref(database, "admins");
    const fetchAdmins = async () => {
      try {
        setIsLoading(true);
        const snapshot = await get(adminsRef);

        if (snapshot.exists()) {
          const data = snapshot.val();
          const formattedData = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));

          // Sort by name
          formattedData.sort((a, b) => a.email.localeCompare(b.email));
          setAdmins(formattedData);
        } else {
          setAdmins([]);
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

    onValue(adminsRef, fetchAdmins, (error) => {
      console.error("Error fetching lecturers:", error);
      toast("Error", {
        description: "Gagal memuat data dosen.",
      });
      setIsLoading(false);
    });

    return () => {
      off(adminsRef)
    }
  }, []);

  const filteredLecturers = admins.filter(
    (admin) =>
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) &&
      admin.email.toLowerCase() !== user?.email?.toLowerCase()
  );



  const updateAdminList = useCallback((admin: Admin) => {
    setAdmins((prev) => {
      const index = prev.findIndex((l) => l.id === admin.id);
      if (index >= 0) {
        // Update existing admin
        const updated = [...prev];
        updated[index] = admin;
        return updated;
      }
      // Add new lecturer
      const newList = [...prev, admin];
      // Sort by name
      newList.sort((a, b) => a.email.localeCompare(b.email));
      return newList;
    })
  }, [])

  const handleDeleteAdmin = useCallback(async () => {
    if (!selectedAdmin) return;

    setIsDeleting(true);
    try {
      const adminRef = ref(database, `admins/${selectedAdmin.id}`);

      await remove(adminRef);

      toast("Berhasil", {
        description: `Data admin ${selectedAdmin.email} berhasil dihapus.`,
      });

      setAdmins((prev) => prev.filter((l) => l.id !== selectedAdmin.id));
      setShowDeleteDialog(false);
      setSelectedAdmin(null);
    } catch (error: any) {
      console.error("Error deleting lecturer:", error);
      toast("Error", {
        description: `Gagal menghapus data: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedAdmin]);

  return {
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
  }
}