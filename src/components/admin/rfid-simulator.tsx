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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Format tanggal YYYY-MM-DD
function getFormattedDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format waktu HH:MM:SS
function getFormattedTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function RfidSimulator() {
  const [uid, setUid] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{message: string; status: 'success' | 'error' | 'info' | null}>({
    message: '',
    status: null
  });
  
  // Define interfaces for our data structures
  interface PresenceData {
    uid: string;
    tanggal: string;
    status: 'masuk' | 'pulang';
    lastUpdated: number;
    checkInTime?: string;
    checkOutTime?: string;
  }
  
  interface LecturerPresenceData {
    name: string;
    lecturerCode: string;
    status: 'masuk' | 'pulang';
    lastUpdated: number;
    checkInTime?: string;
    checkOutTime?: string;
  }
  const [availableRfids, setAvailableRfids] = useState<{uid: string, lecturer?: string, status?: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanMode, setScanMode] = useState<'masuk' | 'pulang'>('masuk');
  
  // Load registered RFID UIDs and their current status
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
        const rfids: {uid: string, lecturer?: string, status?: string}[] = Object.keys(rfidData).map(key => ({
          uid: key
        }));
        
        // Get lecturers to match RFID with names and current status
        const lecturersRef = ref(database, 'lecturers');
        const lecturersSnapshot = await get(lecturersRef);
        
        if (lecturersSnapshot.exists()) {
          const lecturersData = lecturersSnapshot.val();
          
          rfids.forEach(rfid => {
            for (const key in lecturersData) {
              if (lecturersData[key].rfidUid === rfid.uid) {
                rfid.lecturer = lecturersData[key].name;
                rfid.status = lecturersData[key].status || 'tidak hadir';
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
  }, [result]); // Refresh when result changes to update statuses
  
  // Check if already present today and get current status
  const checkPresenceStatus = async (uid: string) => {
    try {
      const date = getFormattedDate();
      
      const presenceRef = ref(database, `presence/${date}/${uid}`);
      const snapshot = await get(presenceRef);
      
      if (!snapshot.exists()) {
        return { exists: false, currentStatus: null };
      }
      
      const data = snapshot.val();
      return { 
        exists: true, 
        currentStatus: data.status || 'masuk',
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime
      };
    } catch (error) {
      console.error('Error checking presence:', error);
      return { exists: false, currentStatus: null };
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
      const currentTime = getFormattedTime();
      const timestamp = Date.now();
      
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
      
      // Cek status presensi saat ini
      const { exists, currentStatus, checkInTime, checkOutTime } = await checkPresenceStatus(uid);
      
      // Logika untuk check-in dan check-out
      if (scanMode === 'masuk') {
        if (exists && currentStatus === 'masuk') {
          setResult({
            message: `UID ${uid} sudah melakukan check-in hari ini`,
            status: 'info'
          });
          setIsSubmitting(false);
          return;
        }
        
        if (exists && currentStatus === 'pulang') {
          setResult({
            message: `UID ${uid} sudah melakukan check-out hari ini dan tidak dapat check-in lagi`,
            status: 'error'
          });
          setIsSubmitting(false);
          return;
        }
      } else if (scanMode === 'pulang') {
        if (!exists || currentStatus !== 'masuk') {
          setResult({
            message: `UID ${uid} belum melakukan check-in hari ini, tidak dapat check-out`,
            status: 'error'
          });
          setIsSubmitting(false);
          return;
        }
        
        if (exists && currentStatus === 'pulang') {
          setResult({
            message: `UID ${uid} sudah melakukan check-out hari ini`,
            status: 'info'
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Catat kehadiran
      const presenceRef = ref(database, `presence/${date}/${uid}`);
      
      const presenceData: PresenceData = {
        uid: uid,
        tanggal: date,
        status: scanMode,
        lastUpdated: timestamp
      };
      
      if (scanMode === 'masuk') {
        presenceData.checkInTime = currentTime;
      } else if (exists && currentStatus === 'masuk') {
        presenceData.checkInTime = checkInTime;
        presenceData.checkOutTime = currentTime;
      }
      
      await set(presenceRef, presenceData);
      
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
          const lecturerRef = ref(database, `lecturers/${lecturerId}`);
          await update(lecturerRef, {
            status: scanMode,
            lastUpdated: timestamp
          });
          
          // Record in lecturer_presence
          const presenceHistoryRef = ref(database, `lecturer_presence/${date}/${lecturerId}`);
          
          const presenceHistoryData: LecturerPresenceData = {
            name: lecturerName,
            lecturerCode: lecturers[lecturerId].lecturerCode,
            status: scanMode,
            lastUpdated: timestamp
          };
          
          if (scanMode === 'masuk') {
            presenceHistoryData.checkInTime = currentTime;
          } else if (exists) {
            // Get existing check-in time if available
            const existingPresenceRef = ref(database, `lecturer_presence/${date}/${lecturerId}`);
            const existingPresenceSnapshot = await get(existingPresenceRef);
            
            if (existingPresenceSnapshot.exists()) {
              const existingData = existingPresenceSnapshot.val();
              if (existingData.checkInTime) {
                presenceHistoryData.checkInTime = existingData.checkInTime;
              }
            }
            
            presenceHistoryData.checkOutTime = currentTime;
          }
          
          await set(presenceHistoryRef, presenceHistoryData);
          
          const action = scanMode === 'masuk' ? 'Check-in' : 'Check-out';
          setResult({
            message: `${action} berhasil: ${lecturerName} (${currentTime})`,
            status: 'success'
          });
        } else {
          setResult({
            message: `Presensi tercatat, tetapi UID tidak terkait dengan dosen manapun`,
            status: 'info'
          });
        }
      } else {
        setResult({
          message: `Presensi tercatat, tetapi tidak ada data dosen`,
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
          Simulasikan scanning kartu RFID untuk check-in dan check-out
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Select - Check-in or Check-out */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Mode Scan</label>
            <RadioGroup 
              value={scanMode} 
              onValueChange={(value) => setScanMode(value as 'masuk' | 'pulang')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="masuk" id="masuk" />
                <Label htmlFor="masuk" className="cursor-pointer">Check-in (Datang)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pulang" id="pulang" />
                <Label htmlFor="pulang" className="cursor-pointer">Check-out (Pulang)</Label>
              </div>
            </RadioGroup>
          </div>
          
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
                {isSubmitting ? 'Memproses...' : scanMode === 'masuk' ? 'Check-in' : 'Check-out'}
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
            <Alert>
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
                      className="p-2 border rounded-md flex items-center justify-between cursor-pointer hover:bg-muted"
                      onClick={() => setUid(rfid.uid)}
                    >
                      <span className="font-medium">{rfid.uid}</span>
                      <div className="flex flex-col items-end">
                        {rfid.lecturer && (
                          <span className="text-muted-foreground">{rfid.lecturer}</span>
                        )}
                        {rfid.status && (
                          <span className={`text-xs ${
                            rfid.status === 'masuk' ? 'text-green-500' : 
                            rfid.status === 'pulang' ? 'text-blue-500' : 
                            'text-muted-foreground'
                          }`}>
                            {rfid.status === 'masuk' ? '✓ Check-in' : 
                             rfid.status === 'pulang' ? '✓ Check-out' : 
                             'Tidak hadir'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Tanggal simulasi: {getFormattedDate()} - Waktu: {getFormattedTime()}</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}