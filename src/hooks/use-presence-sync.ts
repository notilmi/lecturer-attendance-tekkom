// hooks/use-presence-sync.ts
// Hook untuk mengsinkronkan status kehadiran dosen berdasarkan data presensi
// Mendukung penghapusan kehadiran: jika UID dihapus, status dosen juga diupdate menjadi "tidak hadir"

import { useEffect, useRef } from 'react';
import { ref, onValue, off, get, update, remove } from 'firebase/database';
import { database } from '@/lib/firebase/';

// Format tanggal YYYY-MM-DD
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function UsePresenceSync() {
  // Menggunakan ref untuk menyimpan state terkini dari data dosen dan presence
  const lecturersRef = useRef<Record<string, any>>({});
  const presenceRef = useRef<Record<string, any>>({});
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const todayDate = getFormattedDate();
    
    console.log('🔄 Memulai sinkronisasi kehadiran untuk tanggal:', todayDate);
    
    // Listen untuk perubahan di data dosen
    const dbLecturersRef = ref(database, 'lecturers');
    
    const handleLecturersChange = (snapshot: any) => {
      if (!snapshot.exists()) {
        lecturersRef.current = {};
        return;
      }
      
      lecturersRef.current = snapshot.val();
      console.log('📋 Data dosen diperbarui');
    };
    
    const lecturersUnsubscribe = onValue(dbLecturersRef, handleLecturersChange);
    
    // Listen untuk perubahan di data presensi untuk hari ini
    const dbPresenceRef = ref(database, `presence/${todayDate}`);
    
    const handlePresenceChange = async (snapshot: any) => {
      // Simpan data presence sebelumnya untuk dibandingkan
      const previousPresence = { ...presenceRef.current };
      
      // Update data presence terkini
      if (!snapshot.exists()) {
        presenceRef.current = {};
      } else {
        presenceRef.current = snapshot.val();
      }
      
      console.log('🔄 Perubahan terdeteksi pada data kehadiran');
      
      try {
        // Waktu sekarang untuk update
        const updateTime = Date.now();
        
        // 1. Periksa UID baru yang ditambahkan ke presence (untuk mengubah status menjadi "hadir")
        for (const uid in presenceRef.current) {
          // Cari dosen dengan RFID UID yang cocok
          for (const lecturerId in lecturersRef.current) {
            const lecturer = lecturersRef.current[lecturerId];
            
            if (lecturer.rfidUid === uid) {
              // Dosen ditemukan, update statusnya jika belum "hadir"
              if (lecturer.status !== 'hadir') {
                console.log(`✏️ Memperbarui status dosen ${lecturer.name} menjadi "hadir"`);
                
                // Update status di lecturers
                const lecturerRef = ref(database, `lecturers/${lecturerId}`);
                await update(lecturerRef, {
                  status: 'hadir',
                  lastUpdated: updateTime
                });
                
                // Catat di riwayat kehadiran jika belum ada
                const presenceHistoryRef = ref(database, `lecturer_presence/${todayDate}/${lecturerId}`);
                const presenceHistorySnapshot = await get(presenceHistoryRef);
                
                if (!presenceHistorySnapshot.exists()) {
                  console.log(`📝 Mencatat riwayat kehadiran untuk ${lecturer.name}`);
                  
                  await update(presenceHistoryRef, {
                    name: lecturer.name,
                    lecturerCode: lecturer.lecturerCode,
                    time: updateTime,
                    status: 'hadir'
                  });
                }
              }
              break; // Lanjut ke UID berikutnya
            }
          }
        }
        
        // 2. Periksa UID yang dihapus dari presence (untuk mengubah status kembali menjadi "tidak hadir")
        for (const uid in previousPresence) {
          // Jika UID tidak ada di presence saat ini, berarti sudah dihapus
          if (!presenceRef.current[uid]) {
            console.log(`🔍 UID ${uid} telah dihapus dari data kehadiran`);
            
            // Cari dosen dengan RFID UID yang cocok
            for (const lecturerId in lecturersRef.current) {
              const lecturer = lecturersRef.current[lecturerId];
              
              if (lecturer.rfidUid === uid) {
                // Dosen ditemukan, update statusnya menjadi "tidak hadir"
                console.log(`✏️ Memperbarui status dosen ${lecturer.name} menjadi "tidak hadir"`);
                
                // Update status di lecturers
                const lecturerRef = ref(database, `lecturers/${lecturerId}`);
                await update(lecturerRef, {
                  status: 'tidak hadir',
                  lastUpdated: updateTime
                });
                
                // Hapus dari riwayat kehadiran jika ada
                const presenceHistoryRef = ref(database, `lecturer_presence/${todayDate}/${lecturerId}`);
                const presenceHistorySnapshot = await get(presenceHistoryRef);
                
                if (presenceHistorySnapshot.exists()) {
                  console.log(`🗑️ Menghapus riwayat kehadiran untuk ${lecturer.name}`);
                  await remove(presenceHistoryRef);
                }
                
                break; // Lanjut ke UID berikutnya
              }
            }
          }
        }
        
      } catch (error) {
        console.error('❌ Error saat memproses kehadiran:', error);
      }
    };
    
    const presenceUnsubscribe = onValue(dbPresenceRef, handlePresenceChange);
    
    // Cleanup listener saat komponen unmount
    return () => {
      off(dbLecturersRef);
      off(dbPresenceRef);
      console.log('🛑 Menghentikan sinkronisasi kehadiran');
    };
  }, []);
}