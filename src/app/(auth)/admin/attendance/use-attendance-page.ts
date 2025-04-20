import { database } from "@/lib/firebase";
import { LecturePresence } from "@/lib/schema/lecture-presence";
import { get, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatTime } from "./utils";

export function UseAttendancePage() {

    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [attendanceData, setAttendanceData] = useState<LecturePresence[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("daily");
    const [isLoadingDates, setIsLoadingDates] = useState(true);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<LecturePresence | null>(
        null
    );
    const [isDeleting, setIsDeleting] = useState(false);
    const [summary, setSummary] = useState<{ [key: string]: number }>({
        total: 0,
        present: 0,
        scheduled: 0,
        unscheduled: 0,
    });

    // Fetch available dates
    useEffect(() => {
        const fetchDates = async () => {
            try {
                setIsLoadingDates(true);
                const presenceRef = ref(database, "lecturer_presence");
                const snapshot = await get(presenceRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const dateList = Object.keys(data).sort().reverse(); // Sort dates descending
                    setDates(dateList);

                    // Select most recent date by default
                    if (dateList.length > 0 && !selectedDate) {
                        setSelectedDate(dateList[0]);
                    }
                } else {
                    setDates([]);
                }
            } catch (error) {
                console.error("Error fetching dates:", error);
            } finally {
                setIsLoadingDates(false);
            }
        };

        fetchDates();
    }, [selectedDate]);

    // Fetch attendance data for selected date
    useEffect(() => {
        if (!selectedDate) return;

        const fetchAttendanceData = async () => {
            try {
                setIsLoadingData(true);
                const attendanceRef = ref(
                    database,
                    `lecturer_presence/${selectedDate}`
                );
                const snapshot = await get(attendanceRef);

                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const formattedData = Object.keys(data).map((key) => ({
                        lecturerId: key,
                        ...data[key],
                    }));

                    // Sort by time
                    formattedData.sort((a, b) => b.time - a.time);

                    setAttendanceData(formattedData);

                    // Calculate summary
                    const summaryData = {
                        total: formattedData.length,
                        present: formattedData.filter((record) => record.status === "hadir")
                            .length,
                        scheduled: formattedData.filter((record) => record.isScheduled)
                            .length,
                        unscheduled: formattedData.filter((record) => !record.isScheduled)
                            .length,
                    };

                    setSummary(summaryData);
                } else {
                    setAttendanceData([]);
                    setSummary({ total: 0, present: 0, scheduled: 0, unscheduled: 0 });
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchAttendanceData();
    }, [selectedDate]);

    // Filter attendance data by search query
    const filteredAttendance = attendanceData.filter(
        (record) =>
            record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.lecturerCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Handle delete attendance record
    const handleDeleteRecord = async () => {
        if (!selectedRecord || !selectedDate) return;

        try {
            setIsDeleting(true);
            const recordRef = ref(
                database,
                `lecturer_presence/${selectedDate}/${selectedRecord.lecturerId}`
            );
            await remove(recordRef);

            toast("Berhasil", {
                description: `Data kehadiran ${selectedRecord.name} berhasil dihapus.`,
            });

            // Update local state
            setAttendanceData((prev) =>
                prev.filter((item) => item.lecturerId !== selectedRecord.lecturerId)
            );

            // Update summary
            setSummary((prev) => ({
                ...prev,
                total: prev.total - 1,
                present:
                    selectedRecord.status === "hadir" ? prev.present - 1 : prev.present,
                scheduled: selectedRecord.isScheduled
                    ? prev.scheduled - 1
                    : prev.scheduled,
                unscheduled: !selectedRecord.isScheduled
                    ? prev.unscheduled - 1
                    : prev.unscheduled,
            }));

            setSelectedRecord(null);
        } catch (error: any) {
            console.error("Error deleting record:", error);
            toast("Error", {
                description: `Gagal menghapus data: ${error.message}`,
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Export attendance data to CSV
    const exportToCSV = () => {
        if (!selectedDate || attendanceData.length === 0) return;

        const headers = ["Nama", "Kode Dosen", "Waktu", "Status", "Sesuai Jadwal"];

        const csvRows = [
            headers.join(","),
            ...filteredAttendance.map((record) => {
                const row = [
                    `"${record.name}"`,
                    record.lecturerCode,
                    formatTime(record.time),
                    record.status,
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

        toast("Berhasil", {
            description: "Data kehadiran berhasil diunduh.",
        });
    };

    return {
        dates,
        setDates,
        selectedDate,
        setSelectedDate,
        attendanceData,
        setAttendanceData,
        searchQuery,
        setSearchQuery,
        isLoadingData,
        setIsLoadingData,
        activeTab,
        setActiveTab,
        isLoadingDates, 
        setIsLoadingDates,
        isDeleting,
        setIsDeleting,
        summary,
        setSummary,
        filteredAttendance,
        handleDeleteRecord,
        exportToCSV,
        setSelectedRecord
    }
}