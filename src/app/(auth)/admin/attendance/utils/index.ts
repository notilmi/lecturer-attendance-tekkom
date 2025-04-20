import { format } from "date-fns";
import { id } from "date-fns/locale";

const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    const [year, month, day] = dateStr.split("-").map(Number);
    return format(new Date(year, month - 1, day), "EEEE, d MMMM yyyy", {
        locale: id,
    });
};

// Format time
const formatTime = (timestamp: number) => {
    return format(new Date(timestamp), "HH:mm", { locale: id });
};

export { formatDate, formatTime };