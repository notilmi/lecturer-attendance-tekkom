export function getDayName(date: Date = new Date()): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
}

export function isTeachingDay(teachingDays: string[]): boolean {
    const today = getDayName();
    return teachingDays.includes(today);
}