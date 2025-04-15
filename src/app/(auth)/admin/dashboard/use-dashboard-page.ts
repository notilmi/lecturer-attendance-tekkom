import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, signOut } from 'firebase/auth';
import { ref, onValue, off, get } from 'firebase/database';
import { database } from '@/lib/firebase';

export function UseDashboardPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');

    // Data states
    const [lecturers, setLecturers] = useState<any[]>([]);
    const [todayPresence, setTodayPresence] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
    const pastWeekDates = (() => {
        const dates = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(getFormattedDate(date));
        }
        return dates;
    })();

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
                ...data[key]
            }));

            setLecturers(formattedData);
        };

        const lecturersUnsubscribe = onValue(lecturersRef, handleLecturersData, (err) => {
            console.error('Error fetching lecturers:', err);
        });

        const presenceRef = ref(database, `lecturer_presence/${todayFormatted}`);

        const handlePresenceData = (snapshot: any) => {
            if (!snapshot.exists()) {
                setTodayPresence([]);
                return;
            }

            const data = snapshot.val();
            const formattedData = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));

            // Sort by time (most recent first)
            formattedData.sort((a, b) => b.time - a.time);

            setTodayPresence(formattedData);
            setIsLoading(false);
        };

        const presenceUnsubscribe = onValue(presenceRef, handlePresenceData, (err) => {
            console.error('Error fetching presence:', err);
        });

        const fetchWeeklyData = useCallback(async () => {
            try {
                const weekData = [];

                for (const dateStr of pastWeekDates) {
                    const datePresenceRef = ref(database, `lecturer_presence/${dateStr}`);
                    const snapshot = await get(datePresenceRef);

                    const presentCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
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
        }, [pastWeekDates, lecturers]);

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
    const presentToday = lecturers.filter(l => l.status === 'hadir').length;
    const presentPercentage = totalLecturers > 0 ? Math.round((presentToday / totalLecturers) * 100) : 0;

    const avgArrivalTime = useMemo(() => {
        if (todayPresence.length === 0) return "00:00";

        let totalMinutes = 0;

        todayPresence.forEach(p => {
            const date = new Date(p.time);
            totalMinutes += date.getHours() * 60 + date.getMinutes();
        });

        const avgMinutes = Math.round(totalMinutes / todayPresence.length);
        const hours = Math.floor(avgMinutes / 60);
        const minutes = avgMinutes % 60;

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }, [todayPresence]);


    const pieChartData = useMemo(() => {
        [
            { name: 'Hadir', value: presentToday },
            { name: 'Tidak Hadir', value: totalLecturers - presentToday }
        ]
    }, [presentToday, totalLecturers]);

    const mostActiveDay = useMemo(() => {
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
    }, [weeklyData]);

    const arrivalDistribution = useMemo(() => {
        const distribution = [
            { time: '07:00-08:00', count: 0 },
            { time: '08:00-09:00', count: 0 },
            { time: '09:00-10:00', count: 0 },
            { time: '10:00-11:00', count: 0 },
            { time: '11:00-12:00', count: 0 }
        ];

        todayPresence.forEach(p => {
            const date = new Date(p.time);
            const hour = date.getHours();

            if (hour >= 7 && hour < 12) {
                const index = hour - 7;
                distribution[index].count++;
            }
        });

        return distribution;
    }, [todayPresence]);

    const COLORS = ['#0088FE', '#FFBB28'];

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
        todayFormatted
    }
}