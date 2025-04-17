export interface Lecturer {
  id?: string;
  name: string;
  lecturerCode: string;
  rfidUid: string;
  status: "hadir" | "tidak hadir";
  lastUpdated?: number;
  // Tambahkan informasi jadwal mengajar (hari)
  teachingDays: string[]; // Array hari mengajar: ["Senin", "Rabu", dll]
}

export interface LecturerPresence {
  lecturerId: string;
  name: string;
  lecturerCode: string;
  time: number;
  status: "hadir" | "tidak hadir";
  date: string; // Format YYYY-MM-DD
}