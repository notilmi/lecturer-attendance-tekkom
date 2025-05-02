import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ref, get, set, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { Lecturer } from "@/lib/schema/lecturer";
import { RfidTag } from "@/lib/schema/rfid";

export function UseRfidPage() {
  const [rfidTags, setRfidTags] = useState<RfidTag[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTag, setSelectedTag] = useState<RfidTag | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newRfidUid, setNewRfidUid] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch RFID tags and lecturers data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch RFID tags
        const rfidRef = ref(database, "rfid_register");
        const rfidSnapshot = await get(rfidRef);

        // Fetch lecturers to check assignments
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
      } catch (error) {
        console.error("Error fetching data:", error);
        toast("Error", {
          description: "Gagal memuat data RFID.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter tags based on search query
  const filteredTags = rfidTags.filter(
    (tag) =>
      tag.uid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tag.assignedTo?.name &&
        tag.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Validate RFID UID (only alphanumeric characters)
  const isValidRfidUid = (uid: string) => {
    return /^[a-zA-Z0-9]+$/.test(uid);
  };

  // Check if RFID UID already exists
  const isExistingRfidUid = (uid: string) => {
    return rfidTags.some((tag) => tag.uid === uid);
  };

  // Handle add new RFID
  const handleAddRfid = async () => {
    if (!newRfidUid || !isValidRfidUid(newRfidUid)) {
      toast("Input tidak valid", {
        description: "RFID UID hanya boleh berisi karakter alfanumerik.",
      });
      return;
    }

    if (isExistingRfidUid(newRfidUid)) {
      toast("RFID sudah ada", {
        description: "RFID UID ini sudah terdaftar dalam sistem.",
      });
      return;
    }

    setIsAdding(true);
    try {
      const rfidRef = ref(database, `rfid_register/${newRfidUid}`);

      await set(rfidRef, newRfidUid);

      // Add to local state
      setRfidTags((prev) => [
        ...prev,
        {
          uid: newRfidUid,
          value: newRfidUid,
          isAssigned: false,
        },
      ]);

      toast("Berhasil", {
        description: `RFID UID ${newRfidUid} berhasil ditambahkan.`,
      });

      setNewRfidUid("");
      setShowAddDialog(false);
      setIsRefreshing(true)
    } catch (error: any) {
      console.error("Error adding RFID:", error);
      toast("Error", {
        description: `Gagal menambahkan RFID: ${error.message}`,
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Handle delete RFID
  const handleDeleteRfid = async () => {
    if (!selectedTag) return;

    if (selectedTag.isAssigned) {
      toast("Tidak dapat menghapus", {
        description: `RFID ini sedang digunakan oleh ${selectedTag.assignedTo?.name}. Lepaskan asosiasi terlebih dahulu.`,
      });
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);
    try {
      const rfidRef = ref(database, `rfid_register/${selectedTag.uid}`);

      await remove(rfidRef);

      // Remove from local state
      setRfidTags((prev) => prev.filter((tag) => tag.uid !== selectedTag.uid));

      toast("Berhasil", {
        description: `RFID UID ${selectedTag.uid} berhasil dihapus.`,
      });

      setShowDeleteDialog(false);
      setSelectedTag(null);
    } catch (error: any) {
      console.error("Error deleting RFID:", error);
      toast("Error", {
        description: `Gagal menghapus RFID: ${error.message}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    rfidTags,
    setRfidTags,
    lecturers,
    setLecturers,
    searchQuery,
    setSearchQuery,
    isLoading,
    setIsLoading,
    isRefreshing,
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
    setIsDeleting,
    isAdding,
    setIsAdding,
    filteredTags,
    isValidRfidUid,
    isExistingRfidUid,
    handleAddRfid,
    handleDeleteRfid,
  }
}
