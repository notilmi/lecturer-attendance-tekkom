import { useState, useEffect, useMemo } from 'react';
import { ref, onValue, off, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Lecturer } from '@/lib/schema/lecturer';
import { LecturePresence } from '@/lib/schema/lecture-presence';

export function useDashboardPage() {
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [todayPresence, setTodayPresence] = useState<LecturePresence[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [pieChartData, setPieChartData] = useState<{ label: string; value: number }[]>([]);

    // Format date to YYYY-MM-DD
    const getFormattedDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get today's date
    const today = new Date();
    const todayFormatted = getFormattedDate(today);

    // Get the dates for the past week
    const getPastWeekDates = () => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(getFormattedDate(date));
        }
        return dates;
    };

    const pastWeekDates = getPastWeekDates();

    // Format time
    const formatTime = (timestamp: number): string => {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    // Get the day name in Indonesian
    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long' });
    };

    // Get current day name
    const currentDay = today.toLocaleDateString('id-ID', { weekday: 'long' });

    // Check if lecturer has teaching schedule today
    const isScheduledToday = (lecturer: Lecturer): boolean => {
        return lecturer.teachingDays?.includes(currentDay) || false;
    };

    // Check if lecturer is present (has checked in or already checked out)
    const isLecturerPresent = (lecturer: Lecturer): boolean => {
        return lecturer.status === 'masuk' || lecturer.status === 'pulang' || lecturer.status === 'hadir';
    };

    // Fetch data from Firebase
    useEffect(() => {
        // Fetch lecturers
        const lecturersRef = ref(database, 'lecturers');
        setIsLoading(true);

        const handleLecturersData = (snapshot: any) => {
            if (!snapshot.exists()) {
                setLecturers([]);
                return;
            }

            const data = snapshot.val();
            const formattedData = Object.keys(data).map(key => ({
                id: key,
                ...data[key],
                // Ensure teachingDays exists
                teachingDays: data[key].teachingDays || []
            }));

            setLecturers(formattedData);
        };

        const lecturersUnsubscribe = onValue(lecturersRef, handleLecturersData, (err) => {
            console.error('Error fetching lecturers:', err);
        });

        // Fetch today's presence
        const presenceRef = ref(database, `lecturer_presence/${todayFormatted}`);

        const handlePresenceData = (snapshot: any) => {
            if (!snapshot.exists()) {
                setTodayPresence([]);
                return;
            }

            const data = snapshot.val();
            const formattedData = Object.keys(data).map(key => ({
                lecturerId: key,
                ...data[key]
            }));

            // Sort by time (most recent first)
            formattedData.sort((a, b) => b.lastUpdated - a.lastUpdated);

            setTodayPresence(formattedData);
            setIsLoading(false);
        };

        const presenceUnsubscribe = onValue(presenceRef, handlePresenceData, (err) => {
            console.error('Error fetching presence:', err);
        });

        // Fetch weekly attendance data
        const fetchWeeklyData = async () => {
            try {
                const weekData = [];

                for (const dateStr of pastWeekDates) {
                    const datePresenceRef = ref(database, `lecturer_presence/${dateStr}`);
                    const snapshot = await get(datePresenceRef);

                    let presentCount = 0;
                    
                    if (snapshot.exists()) {
                        const presenceData = snapshot.val();
                        // Count unique lecturers who were present (checked in or out)
                        const uniqueLecturerIds = new Set();
                        
                        Object.keys(presenceData).forEach(key => {
                            const presenceStatus = presenceData[key].status;
                            // If lecturer has any status of masuk, pulang, or hadir, they are counted as present
                            if (presenceStatus === 'masuk' || presenceStatus === 'pulang' || presenceStatus === 'hadir') {
                                uniqueLecturerIds.add(key);
                            }
                        });
                        
                        presentCount = uniqueLecturerIds.size;
                    }
                    
                    const absentCount = lecturers.length - presentCount;

                    weekData.push({
                        date: dateStr,
                        day: getDayName(dateStr),
                        present: presentCount,
                        absent: absentCount >= 0 ? absentCount : 0
                    });
                }

                setWeeklyData(weekData);
            } catch (error) {
                console.error('Error fetching weekly data:', error);
            }
        };

        // Wait for lecturers data before fetching weekly data
        if (lecturers.length > 0) {
            fetchWeeklyData();
        }

        // Clean up listeners on unmount
        return () => {
            off(lecturersRef);
            off(presenceRef);
        };
    }, [todayFormatted, lecturers.length]);

    // Calculate statistics
    const totalLecturers = lecturers.length;
    
    // Count lecturers who are present (checked in or checked out)
    const presentToday = useMemo(() => {
        return lecturers.filter(l => isLecturerPresent(l)).length;
    }, [lecturers]);
    
    const presentPercentage = totalLecturers > 0 ? Math.round((presentToday / totalLecturers) * 100) : 0;

    // Update pie chart data based on current presence
    useEffect(() => {
        const present = presentToday;
        const absent = totalLecturers - present;
        
        setPieChartData([
            { label: 'Hadir', value: present },
            { label: 'Tidak Hadir', value: absent }
        ]);
    }, [presentToday, totalLecturers]);

    // Calculate average arrival time - using check-in time when available
    const calculateAvgArrivalTime = () => {
        if (todayPresence.length === 0) return "00:00";

        let totalMinutes = 0;
        let count = 0;

        todayPresence.forEach(p => {
            // Use checkInTime if available, otherwise use the general timestamp
            let timeToUse;
        
            if (p.checkInTime) {
                // Parse HH:MM format
                const [hours, minutes] = p.checkInTime.split(':').map(Number);
                timeToUse = hours * 60 + minutes;
            } else {
                // Legacy format - use time property
                const timeSource = p.time ?? p.lastUpdated;
        
                if (timeSource !== undefined) {
                    const date = new Date(timeSource);
                    timeToUse = date.getHours() * 60 + date.getMinutes();
                } else {
                    // Default fallback, misalnya 0 menit
                    timeToUse = 0;
                }
            }
        
            totalMinutes += timeToUse;
            count++;
        });
        

        const avgMinutes = Math.round(totalMinutes / count);
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const avgArrivalTime = calculateAvgArrivalTime();

    // Determine most active day
    const getMostActiveDay = () => {
        if (weeklyData.length === 0) return "Belum Ada Data";

        let maxPresent = 0;
        let mostActiveDay = "Belum Ada Data";

        weeklyData.forEach(day => {
            if (day.present > maxPresent) {
                maxPresent = day.present;
                mostActiveDay = day.day;
            }
        });

        return mostActiveDay;
    };

    const mostActiveDay = getMostActiveDay();

    // Generate arrival time distribution - use check-in times when available
    const generateArrivalDistribution = () => {
        const distribution = [
            { time: '07:00-08:00', count: 0 },
            { time: '08:00-09:00', count: 0 },
            { time: '09:00-10:00', count: 0 },
            { time: '10:00-11:00', count: 0 },
            { time: '11:00-12:00', count: 0 }
        ];

        todayPresence.forEach(p => {
            let hour: number | undefined;
        
            if (p.checkInTime) {
                // Parse check-in time (HH:MM format)
                hour = parseInt(p.checkInTime.split(':')[0], 10);
            } else {
                // Legacy format - use time or lastUpdated
                const timeSource = p.time ?? p.lastUpdated;
        
                if (timeSource !== undefined) {
                    const date = new Date(timeSource);
                    hour = date.getHours();
                }
            }
        
            // Only proceed if hour is defined and in the desired range
            if (typeof hour === 'number' && hour >= 7 && hour < 12) {
                const index = hour - 7;
                distribution[index].count++;
            }
        });
        
        return distribution;
    };

    const arrivalDistribution = generateArrivalDistribution();

    // Colors for pie chart
    const COLORS = ['#0088FE', '#FFBB28'];

    // Get statistics for check-in/check-out
    const getCheckInOutStats = () => {
        const totalPresent = presentToday;
        const checkedIn = lecturers.filter(l => l.status === 'masuk').length;
        const checkedOut = lecturers.filter(l => l.status === 'pulang').length;
        const legacyPresent = lecturers.filter(l => l.status === 'hadir').length;
        
        return {
            totalPresent,
            checkedIn,
            checkedOut,
            legacyPresent
        };
    };

    const checkInOutStats = getCheckInOutStats();

    return {
        COLORS,
        mostActiveDay,
        arrivalDistribution,
        avgArrivalTime,
        totalLecturers,
        presentToday,
        presentPercentage,
        formatTime,
        activeTab,
        setActiveTab,
        isLoading,
        setIsLoading,
        lecturers,
        setLecturers,
        weeklyData,
        setWeeklyData,
        todayPresence,
        setTodayPresence,
        pieChartData,
        todayFormatted,
        checkInOutStats,
        isLecturerPresent,
        isScheduledToday,
        currentDay
    };
}