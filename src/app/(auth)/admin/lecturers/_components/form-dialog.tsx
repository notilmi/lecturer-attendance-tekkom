// components/admin/lecturer-form.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ref, get, set, push, update, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase/";
import { Lecturer } from "@/lib/schema/lecturer";

interface LecturerFormProps {
  initialData?: Lecturer;
  onSuccess?: () => void;
  updateLecturerList: (lecturer: Lecturer) => void;
}

export function LecturerForm({
  initialData,
  onSuccess,
  updateLecturerList,
}: LecturerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialData?.name || "");
  const [lecturerCode, setLecturerCode] = useState(
    initialData?.lecturerCode || ""
  );
  const [rfidUid, setRfidUid] = useState(initialData?.rfidUid || "");
  const [teachingDays, setTeachingDays] = useState<string[]>(
    initialData?.teachingDays || []
  );
  const [rfidUids, setRfidUids] = useState<{ uid: string; value: string }[]>(
    []
  );
  const [isLoadingRfid, setIsLoadingRfid] = useState(true);
  const [rfidError, setRfidError] = useState<Error | null>(null);
  const [usedRfidUids, setUsedRfidUids] = useState<string[]>([]);
  const [status, setStatus] = useState<
    "masuk" | "pulang" | "tidak hadir" | "hadir" | "belum hadir"
  >(initialData?.status || "tidak hadir");
  // Form errors
  const [errors, setErrors] = useState({
    name: "",
    lecturerCode: "",
    rfidUid: "",
    status: "",
    teachingDays: "",
  });

  // Daftar hari dalam seminggu
  const daysOfWeek = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];

  // Load RFID UIDs
  useEffect(() => {
    const rfidRef = ref(database, "rfid_register");

    setIsLoadingRfid(true);

    const handleRfidData = (snapshot: any) => {
      try {
        if (!snapshot.exists()) {
          setRfidUids([]);
          setIsLoadingRfid(false);
          return;
        }

        const data = snapshot.val();
        const formattedData = Object.keys(data).map((key) => ({
          uid: key,
          value: data[key],
        }));

        setRfidUids(formattedData);
        setIsLoadingRfid(false);
      } catch (err: any) {
        setRfidError(err);
        setIsLoadingRfid(false);
      }
    };

    const unsubscribe = onValue(rfidRef, handleRfidData, (err) => {
      setRfidError(err);
      setIsLoadingRfid(false);
    });

    // Fetch used RFIDs
    const fetchUsedRfids = async () => {
      try {
        const lecturersRef = ref(database, "lecturers");
        const snapshot = await get(lecturersRef);

        if (snapshot.exists()) {
          const data = snapshot.val();

          // Get all RFID UIDs that are already used, except the one for the current lecturer
          const uids = Object.entries(data)
            .filter(([id, _]) => id !== initialData?.id)
            .map(([_, value]: any) => value.rfidUid);

          setUsedRfidUids(uids);
        }
      } catch (error) {
        console.error("Error fetching used RFIDs:", error);
      }
    };

    fetchUsedRfids();

    // Clean up listener on unmount
    return () => {
      off(rfidRef);
    };
  }, [initialData?.id]);

  // Available RFID UIDs (filter out used ones)
  const availableRfidUids = rfidUids.filter(
    (item) =>
      !usedRfidUids.includes(item.uid) || item.uid === initialData?.rfidUid
  );

  // Handle teaching day change
  const handleTeachingDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setTeachingDays((prev) => [...prev, day]);
    } else {
      setTeachingDays((prev) => prev.filter((d) => d !== day));
    }
  };

  // Validation
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      lecturerCode: "",
      rfidUid: "",
      status: "",
      teachingDays: "",
    };

    if (name.trim().length < 3) {
      newErrors.name = "Nama harus minimal 3 karakter";
      valid = false;
    }

    if (lecturerCode.trim().length < 1) {
      newErrors.lecturerCode = "Kode dosen wajib diisi";
      valid = false;
    }

    if (!status) {
      newErrors.lecturerCode = "Status wajib dipilih";
      valid = false;
    }

    if (!rfidUid) {
      newErrors.rfidUid = "UID RFID wajib dipilih";
      valid = false;
    }

    if (teachingDays.length === 0) {
      newErrors.teachingDays = "Pilih minimal satu hari mengajar";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data
      const lecturerData = {
        name,
        lecturerCode,
        rfidUid,
        teachingDays,
        status: status || "belum hadir",
        lastUpdated: Date.now(),
      };

      if (initialData?.id) {
        // Update existing lecturer
        const lecturerRef = ref(database, `lecturers/${initialData.id}`);
        await update(lecturerRef, lecturerData);
        updateLecturerList({ ...lecturerData, id: initialData.id });
      } else {
        // Add new lecturer
        const lecturersRef = ref(database, "lecturers");
        const newLecturerRef = push(lecturersRef);
        await set(newLecturerRef, lecturerData);
        updateLecturerList({ ...lecturerData, id: newLecturerRef.key || "" });

        // Reset form after successful submission
        setName("");
        setLecturerCode("");
        setRfidUid("");
        setTeachingDays([]);
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast("Gagal", {
        description: error.message || "Terjadi kesalahan saat menyimpan data",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh RFID list
  const refreshRfidList = () => {
    window.location.reload();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Lengkap</Label>
        <Input
          id="name"
          placeholder="Masukkan nama dosen"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lecturerCode">Kode Dosen</Label>
        <Input
          id="lecturerCode"
          placeholder="Contoh: DSN001"
          value={lecturerCode}
          onChange={(e) => setLecturerCode(e.target.value)}
          disabled={isSubmitting}
        />
        {errors.lecturerCode && (
          <p className="text-sm text-destructive">{errors.lecturerCode}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="rfidUid">UID RFID</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={refreshRfidList}
            disabled={isLoadingRfid || isSubmitting}
            className="h-8 px-2 py-0"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>

        {isLoadingRfid ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Memuat data RFID...
            </span>
          </div>
        ) : rfidError ? (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error memuat data RFID: {rfidError.message}
            </AlertDescription>
          </Alert>
        ) : availableRfidUids.length === 0 ? (
          <div className="text-sm text-muted-foreground py-2">
            {rfidUids.length === 0
              ? "Tidak ada UID RFID yang tersedia. Silakan daftarkan kartu RFID terlebih dahulu."
              : "Semua UID RFID sudah digunakan. Silakan daftarkan kartu RFID baru."}
          </div>
        ) : (
          <Select
            value={rfidUid}
            onValueChange={setRfidUid}
            disabled={isLoadingRfid || isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih UID RFID" />
            </SelectTrigger>
            <SelectContent>
              {availableRfidUids.map((item) => (
                <SelectItem key={item.uid} value={item.uid}>
                  {item.uid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {errors.rfidUid && (
          <p className="text-sm text-destructive">{errors.rfidUid}</p>
        )}
      </div>

      {initialData && (
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) =>
              setStatus(
                value as
                  | "masuk"
                  | "pulang"
                  | "tidak hadir"
                  | "hadir"
                  | "belum hadir"
              )
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih Status Dosen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="masuk">Hadir</SelectItem>
              <SelectItem value="pulang">Pulang</SelectItem>
              <SelectItem value="belum hadir">Belum Hadir</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-destructive">{errors.status}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div>
          <Label>Jadwal Mengajar</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Pilih hari dimana dosen memiliki jadwal mengajar
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day}`}
                checked={teachingDays.includes(day)}
                onCheckedChange={(checked) =>
                  handleTeachingDayChange(day, checked === true)
                }
                disabled={isSubmitting}
              />
              <Label htmlFor={`day-${day}`}>{day}</Label>
            </div>
          ))}
        </div>
        {errors.teachingDays && (
          <p className="text-sm text-destructive">{errors.teachingDays}</p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        {initialData && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isSubmitting}
          >
            Batal
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Menyimpan..." : "Menambahkan..."}
            </>
          ) : initialData ? (
            "Perbarui Dosen"
          ) : (
            "Tambah Dosen"
          )}
        </Button>
      </div>
    </form>
  );
}
