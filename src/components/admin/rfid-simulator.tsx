// components/admin/rfid-simulator.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ref, get, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { AlertCircle, Clock, Zap } from 'lucide-react';

// Format tanggal YYYY-MM-DD
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function RfidSimulator() {
  const [uid, setUid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{message: string; status: 'success' | 'error' | 'info' | null}>({
    message: '',
    status: null
  });
  const [availableRfids, setAvailableRfids] = useState<{uid: string, lecturer?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load registered RFID UIDs
  useEffect(() => {
    const fetchRfidData = async () => {
      setIsLoading(true);
      
      try {
        
        // Get RFID registry
        const rfidRef = ref(database, 'rfid_register');
        const rfidSnapshot = await get(rfidRef);
        
        if (!rfidSnapshot.exists()) {
          setAvailableRfids([]);
          setIsLoading(false);
          return;
        }
        
        const rfidData = rfidSnapshot.val();
        const rfids: {uid: string, lecturer?: string}[] = Object.keys(rfidData).map(key => ({
          uid: key
        }));
        
        // Get lecturers to match RFID with names
        const lecturersRef = ref(database, 'lecturers');
        const lecturersSnapshot = await get(lecturersRef);
        
        if (lecturersSnapshot.exists()) {
          const lecturersData = lecturersSnapshot.val();
          
          rfids.forEach(rfid => {
            for (const key in lecturersData) {
              if (lecturersData[key].rfidUid === rfid.uid) {
                rfid.lecturer = lecturersData[key].name;
                break;
              }
            }
          });
        }
        
        setAvailableRfids(rfids);
      } catch (error) {
        console.error('Error fetching RFID data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRfidData();
  }, []);
  
  // Check if already present today
  const checkExistingPresence = async (uid: string) => {
    try {
      const date = getFormattedDate();
      
      const presenceRef = ref(database, `presence/${date}/${uid}`);
      const snapshot = await get(presenceRef);
      
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking presence:', error);
      return false;
    }
  };
  
  // Submit RFID simulation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setResult({ message: '', status: null });
    
    if (!uid.trim()) {
      setResult({
        message: 'Mohon masukkan UID RFID',
        status: 'error'
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      const date = getFormattedDate();
      
      // Cek apakah RFID terdaftar
      const rfidRef = ref(database, `rfid_register/${uid}`);
      const rfidSnapshot = await get(rfidRef);
      
      if (!rfidSnapshot.exists()) {
        setResult({
          message: `UID ${uid} tidak terdaftar dalam sistem`,
          status: 'error'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Cek apakah sudah presensi hari ini
      const alreadyPresent = await checkExistingPresence(uid);
      
      if (alreadyPresent) {
        setResult({
          message: `UID ${uid} sudah melakukan presensi hari ini`,
          status: 'info'
        });
        setIsSubmitting(false);
        return;
      }
      
      // Catat kehadiran
      const presenceRef = ref(database, `presence/${date}/${uid}`);
      await set(presenceRef, {
        uid: uid,
        tanggal: date
      });
      
      // Cari dosen dengan UID yang cocok
      const lecturersRef = ref(database, 'lecturers');
      const lecturersQuery = ref(database, 'lecturers');
      const lecturersSnapshot = await get(lecturersQuery);
      
      if (lecturersSnapshot.exists()) {
        const lecturers = lecturersSnapshot.val();
        let lecturerName = '';
        let lecturerId = '';
        
        // Find matching lecturer
        for (const key in lecturers) {
          if (lecturers[key].rfidUid === uid) {
            lecturerName = lecturers[key].name;
            lecturerId = key;
            break;
          }
        }
        
        if (lecturerId) {
          // Update lecturer status
          const updateTime = Date.now();
          const lecturerRef = ref(database, `lecturers/${lecturerId}`);
          await update(lecturerRef, {
            status: 'hadir',
            lastUpdated: updateTime
          });
          
          // Record in lecturer_presence
          const presenceHistoryRef = ref(database, `lecturer_presence/${date}/${lecturerId}`);
          await set(presenceHistoryRef, {
            name: lecturerName,
            lecturerCode: lecturers[lecturerId].lecturerCode,
            time: updateTime,
            status: 'hadir'
          });
          
          setResult({
            message: `Presensi berhasil: ${lecturerName}`,
            status: 'success'
          });
        } else {
          setResult({
            message: `Kehadiran tercatat, tetapi UID tidak terkait dengan dosen manapun`,
            status: 'info'
          });
        }
      } else {
        setResult({
          message: `Kehadiran tercatat, tetapi tidak ada data dosen`,
          status: 'info'
        });
      }
      
      // Reset form
      setUid('');
    } catch (error: any) {
      console.error('Error simulating RFID:', error);
      setResult({
        message: `Error: ${error.message}`,
        status: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Simulator RFID
        </CardTitle>
        <CardDescription>
          Simulasikan scanning kartu RFID untuk testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="uid" className="text-sm font-medium">
              UID RFID
            </label>
            <div className="flex gap-2">
              <Input
                id="uid"
                placeholder="Masukkan UID RFID"
                value={uid}
                onChange={(e) => setUid(e.target.value)}
                disabled={isSubmitting}
                list="rfid-options"
              />
              <Button type="submit" disabled={isSubmitting || !uid.trim()}>
                {isSubmitting ? 'Memproses...' : 'Scan'}
              </Button>
            </div>
            
            <datalist id="rfid-options">
              {availableRfids.map(rfid => (
                <option key={rfid.uid} value={rfid.uid}>
                  {rfid.lecturer ? `${rfid.uid} (${rfid.lecturer})` : rfid.uid}
                </option>
              ))}
            </datalist>
            
            <p className="text-xs text-muted-foreground">
              Masukkan UID dari RFID yang sudah terdaftar
            </p>
          </div>
          
          {result.status && (
            <Alert >
                {/* variant={result.status === 'error' ? 'destructive' : 
                           result.status === 'success' ? 'default' : 
                           'secondary'} */}
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && (
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">UID Terdaftar:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {availableRfids.length === 0 ? (
                  <p className="text-muted-foreground">Tidak ada UID RFID terdaftar</p>
                ) : (
                  availableRfids.map(rfid => (
                    <div 
                      key={rfid.uid} 
                      className="p-2 border rounded-md flex justify-between cursor-pointer hover:bg-muted"
                      onClick={() => setUid(rfid.uid)}
                    >
                      <span>{rfid.uid}</span>
                      {rfid.lecturer && (
                        <span className="text-muted-foreground">{rfid.lecturer}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Tanggal simulasi: {getFormattedDate()}</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}