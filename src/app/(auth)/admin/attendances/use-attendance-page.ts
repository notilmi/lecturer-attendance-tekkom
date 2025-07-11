import { database } from "@/lib/firebase";
import { LecturePresence } from "@/lib/schema/lecture-presence";
import { get, ref, remove } from "firebase/database";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatTime } from "@/app/(auth)/admin/attendances/utils";

export function useAttendancePage() {
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [attendanceData, setAttendanceData] = useState<LecturePresence[]>([]);
    const [lecturers, setLecturers] = useState<any>({});
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
        checkedIn: 0,
        checkedOut: 0,
        scheduled: 0,
        unscheduled: 0,
    });

    // Check if lecturer is present (has checked in or already checked out)
    const isLecturerPresent = (record: LecturePresence): boolean => {
        return record.status === 'masuk' || record.status === 'pulang' || record.status === 'hadir';
    };

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

    // Fetch lecturers data once
    useEffect(() => {
        const fetchLecturers = async () => {
            try {
                const lecturersRef = ref(database, "lecturers");
                const snapshot = await get(lecturersRef);
                if (snapshot.exists()) {
                    setLecturers(snapshot.val());
                } else {
                    setLecturers({});
                }
            } catch (error) {
                setLecturers({});
            }
        };
        fetchLecturers();
    }, []);

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
                    const formattedData = Object.keys(data).map((key) => {
                        const record = data[key];
                        // Cari nama dosen dari lecturers jika field name kosong
                        let name = record.name;
                        if (!name) {
                            // Cari berdasarkan lecturerCode
                            const lecturer = Object.values(lecturers).find((l: any) => l.lecturerCode === record.lecturerCode);
                            name = lecturer ? lecturer.name : "";
                        }
                        return {
                            lecturerId: key,
                            ...record,
                            name,
                            checkInTime: record.checkInTime || null,
                            checkOutTime: record.checkOutTime || null,
                            isScheduled: record.isScheduled || false
                        };
                    });

                    // Sort by lastUpdated or time (most recent first)
                    formattedData.sort((a, b) => (b.lastUpdated || b.time || 0) - (a.lastUpdated || a.time || 0));

                    setAttendanceData(formattedData);

                    // Calculate summary
                    const summaryData = {
                        total: formattedData.length,
                        present: formattedData.filter(record => isLecturerPresent(record)).length,
                        checkedIn: formattedData.filter(record => record.status === "masuk").length,
                        checkedOut: formattedData.filter(record => record.status === "pulang").length,
                        scheduled: formattedData.filter(record => record.isScheduled).length,
                        unscheduled: formattedData.filter(record => !record.isScheduled).length,
                    };
                    setSummary(summaryData);
                } else {
                    setAttendanceData([]);
                    setSummary({ 
                        total: 0, 
                        present: 0, 
                        checkedIn: 0, 
                        checkedOut: 0, 
                        scheduled: 0, 
                        unscheduled: 0 
                    });
                }
            } catch (error) {
                console.error("Error fetching attendance data:", error);
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchAttendanceData();
    }, [selectedDate, lecturers]);

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

            // Update summary based on the deleted record
            setSummary((prev) => {
                const updatedSummary = { ...prev };
                updatedSummary.total -= 1;
                
                // Update status counts
                if (isLecturerPresent(selectedRecord)) {
                    updatedSummary.present -= 1;
                }
                
                if (selectedRecord.status === "masuk") {
                    updatedSummary.checkedIn -= 1;
                } else if (selectedRecord.status === "pulang") {
                    updatedSummary.checkedOut -= 1;
                }
                
                // Update scheduled counts
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

        const headers = [
            "Nama", 
            "Kode Dosen", 
            "Status", 
            "Check-in", 
            "Check-out", 
            "Terakhir Update", 
            "Sesuai Jadwal"
        ];

        const csvRows = [
            headers.join(","),
            ...filteredAttendance.map((record) => {
                const status = 
                    record.status === "masuk" ? "Check-in" :
                    record.status === "pulang" ? "Check-out" :
                    record.status === "hadir" ? "Hadir" : "Tidak Hadir";
                
                // For check-in time, use stored value or generate from timestamp
                let checkInTime = "";
                if (record.checkInTime) {
                    checkInTime = record.checkInTime;
                } else if (record.status === "masuk") {
                    const timestamp = record.lastUpdated || record.time;
                    if (timestamp) {
                        checkInTime = formatTime(timestamp);
                    }
                }
                
                // For check-out time, use stored value or generate from timestamp
                let checkOutTime = "";
                if (record.checkOutTime) {
                    checkOutTime = record.checkOutTime;
                } else if (record.status === "pulang") {
                    const timestamp = record.lastUpdated || record.time;
                    if (timestamp) {
                        checkOutTime = formatTime(timestamp);
                    }
                }
                
                // Use lastUpdated or time, with fallback
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

        toast("Berhasil", {
            description: "Data kehadiran berhasil diunduh.",
        });
    };

    // Get status display text
    const getStatusDisplay = (status: string): string => {
        switch (status) {
            case 'masuk':
                return 'Check-in';
            case 'pulang':
                return 'Check-out';
            case 'hadir':
                return 'Hadir';
            default:
                return 'Tidak Hadir';
        }
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
        setSelectedRecord,
        isLecturerPresent,
        getStatusDisplay
    };
}