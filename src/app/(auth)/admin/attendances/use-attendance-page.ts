"use client";

import { useEffect, useState } from "react";
import { ref, get, remove, update } from "firebase/database";
import { database } from "@/lib/firebase";
import { LecturePresence } from "@/lib/schema/lecture-presence";
import { toast } from "sonner";
import { formatTime } from "./utils";

export interface Summary {
    total: number;
    present: number;
    checkedIn: number;
    checkedOut: number;
    scheduled: number;
    unscheduled: number;
}

export interface UseAttendancePageReturn {
    dates: string[];
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    attendanceData: LecturePresence[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    isLoadingDates: boolean;
    isLoadingData: boolean;
    selectedRecord: LecturePresence | null;
    setSelectedRecord: (record: LecturePresence | null) => void;
    isDeleting: boolean;
    summary: Summary;
    filteredAttendance: LecturePresence[];
    handleDeleteRecord: () => Promise<void>;
    exportToCSV: () => void;
    getStatusDisplay: (status: string) => string;
}

export const useAttendancePage = (): UseAttendancePageReturn => {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [attendanceData, setAttendanceData] = useState<LecturePresence[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoadingDates, setIsLoadingDates] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LecturePresence | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [summary, setSummary] = useState<Summary>({
        total: 0,
        present: 0,
        checkedIn: 0,
        checkedOut: 0,
        scheduled: 0,
        unscheduled: 0,
    });

    const isLecturerPresent = (record: LecturePresence): boolean => {
        return (
            record.status === "masuk" ||
            record.status === "pulang" ||
            record.status === "hadir"
        );
    };

    const filteredAttendance = attendanceData.filter(
        (record) =>
            record.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.lecturerCode?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const fetchDates = async () => {
            try {
                setIsLoadingDates(true);
                const presenceRef = ref(database, "lecturer_presence");
                const snapshot = await get(presenceRef);
                console.log("Firebase snapshot for dates:", snapshot.val());
                if (snapshot.exists()) {
                    const datesData = Object.keys(snapshot.val());
                    console.log("Raw dates from Firebase:", datesData);
                    // Validate date format (YYYY-MM-DD)
                    const validDates = datesData.filter((date) =>
                        /^\d{4}-\d{2}-\d{2}$/.test(date)
                    );
                    // Sort dates in descending order (latest first)
                    validDates.sort((a, b) => b.localeCompare(a));
                    console.log("Sorted valid dates:", validDates);
                    setDates(validDates);
                    if (validDates.length > 0) {
                        setSelectedDate(validDates[0]);
                    } else {
                        console.log("No valid dates found after filtering.");
                        toast.warning("Tidak ada tanggal valid di database.");
                    }
                } else {
                    console.log("No data found in lecturer_presence.");
                    toast.warning("Database lecturer_presence kosong.");
                    setDates([]);
                }
            } catch (error: any) {
                console.error("Error fetching dates:", error);
                toast.error("Gagal memuat daftar tanggal", {
                    description: error.message,
                });
            } finally {
                setIsLoadingDates(false);
            }
        };

        fetchDates();
    }, []);

    useEffect(() => {
        if (!selectedDate) {
            console.log("No selectedDate, skipping attendance data fetch.");
            return;
        }

        const fetchAttendanceData = async () => {
            try {
                setIsLoadingData(true);
                const attendanceRef = ref(database, `lecturer_presence/${selectedDate}`);
                const snapshot = await get(attendanceRef);
                console.log(`Firebase snapshot for ${selectedDate}:`, snapshot.val());
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const attendanceArray: LecturePresence[] = Object.keys(data)
                        .map((key) => ({
                            lecturerId: key,
                            name: data[key].name || "Unknown",
                            lecturerCode: data[key].lecturerCode || "Unknown",
                            status: data[key].status || "tidak hadir",
                            time: data[key].time || 0,
                            lastUpdated: data[key].lastUpdated,
                            checkInTime: data[key].checkInTime,
                            checkOutTime: data[key].checkOutTime,
                            isScheduled: data[key].isScheduled ?? false,
                        }))
                        .filter((record) => {
                            const isValid = record.lecturerId && record.name && record.lecturerCode;
                            if (!isValid) {
                                console.warn("Invalid record filtered out:", record);
                            }
                            return isValid;
                        });
                    console.log("Filtered attendance data:", attendanceArray);
                    setAttendanceData(attendanceArray);

                    const updatedSummary: Summary = {
                        total: attendanceArray.length,
                        present: attendanceArray.filter(isLecturerPresent).length,
                        checkedIn: attendanceArray.filter(
                            (record) => record.status === "masuk"
                        ).length,
                        checkedOut: attendanceArray.filter(
                            (record) => record.status === "pulang"
                        ).length,
                        scheduled: attendanceArray.filter(
                            (record) => record.isScheduled
                        ).length,
                        unscheduled: attendanceArray.filter(
                            (record) => !record.isScheduled
                        ).length,
                    };
                    setSummary(updatedSummary);
                    console.log("Summary:", updatedSummary);
                } else {
                    console.log(`No data found for date: ${selectedDate}`);
                    setAttendanceData([]);
                    setSummary({
                        total: 0,
                        present: 0,
                        checkedIn: 0,
                        checkedOut: 0,
                        scheduled: 0,
                        unscheduled: 0,
                    });
                    toast.warning(`Tidak ada data kehadiran untuk tanggal ${selectedDate}.`);
                }
            } catch (error: any) {
                console.error("Error fetching attendance data:", error);
                toast.error("Gagal memuat data kehadiran", {
                    description: error.message,
                });
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAttendanceData();
    }, [selectedDate]);


    const handleDeleteRecord = async () => {
        if (!selectedRecord || !selectedDate) {
            console.log("No selectedRecord or selectedDate for deletion.");
            return;
        }

        try {
            setIsDeleting(true);

            // 1. Hapus dari lecturer_presence
            const recordRef = ref(
                database,
                `lecturer_presence/${selectedDate}/${selectedRecord.lecturerId}`
            );
            await remove(recordRef);

            // 2. Ambil rfidUid dari lecturers
            const lecturerRef = ref(
                database,
                `lecturers/${selectedRecord.lecturerId}`
            );
            const snapshot = await get(lecturerRef);

            if (snapshot.exists()) {
                const lecturerData = snapshot.val();
                const rfidUid = lecturerData.rfidUid;

                console.log("RFID UID for lecturer:", rfidUid);
                

                if (rfidUid) {
                    const presenceRef = ref(
                        database,
                        `presence/${selectedDate}/${rfidUid}`
                    );

                    console.log("sudah mengambil rfidUid:", rfidUid);

                    await remove(presenceRef);
                }

                await update(lecturerRef, {
                    status: "Belum hadir",
                    lastUpdated: Date.now(),
                });
            }

            // 5. Notifikasi berhasil
            toast.success("Berhasil", {
                description: `Data kehadiran ${selectedRecord.name} berhasil dihapus.`,
            });

            // 6. Update data lokal (frontend)
            setAttendanceData((prev) =>
                prev.filter((item) => item.lecturerId !== selectedRecord.lecturerId)
            );

            setSummary((prev) => {
                const updatedSummary: Summary = { ...prev };
                updatedSummary.total -= 1;

                if (isLecturerPresent(selectedRecord)) {
                    updatedSummary.present -= 1;
                }

                if (selectedRecord.status === "masuk") {
                    updatedSummary.checkedIn -= 1;
                } else if (selectedRecord.status === "pulang") {
                    updatedSummary.checkedOut -= 1;
                }

                if (selectedRecord.isScheduled) {
                    updatedSummary.scheduled -= 1;
                } else {
                    updatedSummary.unscheduled -= 1;
                }

                return updatedSummary;
            });

            setSelectedRecord(null);
        } catch (error: any) {
            console.error("Error deleting record:", error);
            toast.error("Gagal menghapus data", {
                description: error.message,
            });
        } finally {
            setIsDeleting(false);
        }
    };




    const exportToCSV = () => {
        if (!selectedDate || attendanceData.length === 0) {
            toast.error("Tidak ada data untuk diekspor");
            return;
        }

        const headers = [
            "Nama",
            "Kode Dosen",
            "Status",
            "Check-in",
            "Check-out",
            "Terakhir Update",
            "Sesuai Jadwal",
        ];

        const csvRows = [
            headers.join(","),
            ...filteredAttendance.map((record) => {
                const status = getStatusDisplay(record.status);

                let checkInTime = "";
                if (record.checkInTime) {
                    checkInTime = record.checkInTime;
                } else if (record.status === "masuk") {
                    const timestamp = record.lastUpdated || record.time;
                    if (timestamp) {
                        checkInTime = formatTime(timestamp);
                    }
                }

                let checkOutTime = "";
                if (record.checkOutTime) {
                    checkOutTime = record.checkOutTime;
                } else if (record.status === "pulang") {
                    const timestamp = record.lastUpdated || record.time;
                    if (timestamp) {
                        checkOutTime = formatTime(timestamp);
                    }
                }

                const lastUpdate = formatTime(record.lastUpdated || record.time || 0);

                const row = [
                    `"${record.name}"`,
                    record.lecturerCode,
                    status,
                    checkInTime,
                    checkOutTime,
                    lastUpdate,
                    record.isScheduled ? "Ya" : "Tidak",
                ];
                return row.join(",");
            }),
        ];

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `absensi-dosen-${selectedDate}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("Berhasil", {
            description: "Data kehadiran berhasil diunduh.",
        });
    };

    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case "masuk":
                return "Check-in";
            case "pulang":
                return "Check-out";
            case "hadir":
                return "Hadir";
            default:
                return "Tidak Hadir";
        }
    };

    return {
        dates,
        selectedDate,
        setSelectedDate,
        attendanceData,
        searchQuery,
        setSearchQuery,
        isLoadingDates,
        isLoadingData,
        selectedRecord,
        setSelectedRecord,
        isDeleting,
        summary,
        filteredAttendance,
        handleDeleteRecord,
        exportToCSV,
        getStatusDisplay,
    };
};