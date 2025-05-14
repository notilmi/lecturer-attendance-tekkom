export function formatDaysList(days: string[]) {
    if (!days || days.length === 0) return "Tidak ada";
    return days.join(", ");
  };