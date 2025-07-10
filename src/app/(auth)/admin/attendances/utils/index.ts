import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Format date
export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "EEEE, dd MMMM yyyy", { locale: id });
  } catch (error) {
    console.error("Invalid date format:", error);
    return "Format tanggal tidak valid";
  }
};

// Format time
export const formatTime = (timestamp: number | undefined | null) => {
  try {
    // Make sure timestamp is a valid number and not null/undefined
    if (!timestamp) {
      return "--:--";
    }
    
    // Ensure timestamp is a valid number for creating a Date
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "--:--";
    }
    
    return format(date, "HH:mm", { locale: id });
  } catch (error) {
    console.error("Error formatting time:", error);
    return "--:--";
  }
};