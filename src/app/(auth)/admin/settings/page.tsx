'use client';

import { useState, useEffect } from 'react';
import { ref, get, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, WifiOff, RotateCw, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function WifiSettingsPage() {
  // State for WiFi settings
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [lastConnected, setLastConnected] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'online' | 'offline' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);
  
  // Fetch current WiFi settings from Firebase
  useEffect(() => {
    const fetchWifiSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get WiFi settings from Firebase
        const wifiRef = ref(database, 'settings/wifi');
        const wifiSnapshot = await get(wifiRef);
        
        if (wifiSnapshot.exists()) {
          const wifiData = wifiSnapshot.val();
          setWifiSSID(wifiData.ssid || '');
          setWifiPassword(wifiData.password || '');
          
          if (wifiData.lastUpdated) {
            setLastUpdated(new Date(wifiData.lastUpdated).toLocaleString('id-ID'));
          }
          
          if (wifiData.lastConnected) {
            setLastConnected(new Date(wifiData.lastConnected).toLocaleString('id-ID'));
            
            // Check if device is online (last connection within the last 5 minutes)
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            setDeviceStatus(wifiData.lastConnected > fiveMinutesAgo ? 'online' : 'offline');
          } else {
            setDeviceStatus('unknown');
          }
        } else {
          // Create default structure if it doesn't exist
          await set(wifiRef, {
            ssid: 'Dreamz_plus',
            password: 'iniwifi123',
            lastUpdated: Date.now()
          });
          
          setWifiSSID('Dreamz_plus');
          setWifiPassword('iniwifi123');
          setLastUpdated(new Date().toLocaleString('id-ID'));
        }
      } catch (error: any) {
        console.error('Error fetching WiFi settings:', error);
        setError(`Error fetching WiFi settings: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWifiSettings();
    
    // Set up a listener for device connection status
    const statusRef = ref(database, 'settings/deviceStatus');
    const unsubscribe = get(statusRef).then((snapshot) => {
      if (snapshot.exists()) {
        const statusData = snapshot.val();
        if (statusData.lastHeartbeat) {
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          setDeviceStatus(statusData.lastHeartbeat > fiveMinutesAgo ? 'online' : 'offline');
          setLastConnected(new Date(statusData.lastHeartbeat).toLocaleString('id-ID'));
        }
      }
    });
    
    return () => {
      // unsubscribe();
    };
  }, []);
  
  // Handle saving WiFi settings
  const handleSaveSettings = async () => {
    if (!wifiSSID.trim()) {
      setError('SSID tidak boleh kosong');
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const wifiRef = ref(database, 'settings/wifi');
      await update(wifiRef, {
        ssid: wifiSSID,
        password: wifiPassword,
        lastUpdated: Date.now(),
        pendingUpdate: true // Flag for ESP32 to check for new settings
      });
      
      setLastUpdated(new Date().toLocaleString('id-ID'));
      
      toast("Berhasil", {
        description: "Pengaturan WiFi berhasil disimpan. ESP32 akan mengambil pengaturan baru pada koneksi berikutnya.",
      });
    } catch (error: any) {
      console.error('Error saving WiFi settings:', error);
      setError(`Error saving WiFi settings: ${error.message}`);
      
      toast("Error", {
        description: `Gagal menyimpan pengaturan: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Reset WiFi settings to defaults (for emergency recovery)
  const handleResetToDefaults = async () => {
    if (!confirm('Anda yakin ingin mengatur ulang pengaturan WiFi ke default? Ini akan mengembalikan SSID ke "Dreamz_plus" dan password ke "iniwifi123".')) {
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      const wifiRef = ref(database, 'settings/wifi');
      await update(wifiRef, {
        ssid: 'Dreamz_plus',
        password: 'iniwifi123',
        lastUpdated: Date.now(),
        pendingUpdate: true
      });
      
      setWifiSSID('Dreamz_plus');
      setWifiPassword('iniwifi123');
      setLastUpdated(new Date().toLocaleString('id-ID'));
      
      toast("Berhasil", {
        description: "Pengaturan WiFi berhasil diatur ulang ke default.",
      });
    } catch (error: any) {
      console.error('Error resetting WiFi settings:', error);
      setError(`Error resetting WiFi settings: ${error.message}`);
      
      toast("Error", {
        description: `Gagal mengatur ulang pengaturan: ${error.message}`,
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Pengaturan ESP32</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WiFi Settings Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-primary" />
                  Pengaturan WiFi
                </CardTitle>
                <CardDescription>
                  Atur SSID dan password WiFi untuk ESP32
                </CardDescription>
              </div>
              
              <Badge 
                className={deviceStatus === 'online' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : deviceStatus === 'offline'
                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }
              >
                {deviceStatus === 'online' 
                  ? 'Online'
                  : deviceStatus === 'offline'
                  ? 'Offline'
                  : 'Unknown'
                }
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <RotateCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Memuat pengaturan...</span>
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="ssid">WiFi SSID</Label>
                  <Input
                    id="ssid"
                    placeholder="Nama jaringan WiFi"
                    value={wifiSSID}
                    onChange={(e) => setWifiSSID(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">WiFi Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password WiFi"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <Switch
                      id="show-password"
                      checked={showPassword}
                      onCheckedChange={setShowPassword}
                    />
                    <Label htmlFor="show-password">Tampilkan password</Label>
                  </div>
                </div>
                
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground mt-4">
                    Terakhir diperbarui: {lastUpdated}
                  </p>
                )}
                
                {lastConnected && (
                  <p className="text-xs text-muted-foreground">
                    ESP32 terakhir terhubung: {lastConnected}
                  </p>
                )}
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              disabled={isLoading || isSaving}
            >
              Reset ke Default
            </Button>
            
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading || isSaving}
            >
              {isSaving ? (
                <>
                  <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Device Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Informasi Perangkat
            </CardTitle>
            <CardDescription>
              Instruksi untuk ESP32
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>
                Setelah mengubah pengaturan WiFi, ESP32 harus di-restart agar pengaturan baru diterapkan. 
                Pastikan pengaturan SSID dan password benar, karena ESP32 tidak dapat terhubung jika informasi salah.
              </AlertDescription>
            </Alert>
            
            <div className="p-4 border rounded-md bg-muted">
              <h3 className="font-medium mb-2">Prosedur Recovery</h3>
              <p className="text-sm text-muted-foreground">
                Jika ESP32 tidak dapat terhubung ke WiFi, ikuti langkah-langkah berikut:
              </p>
              <ol className="mt-2 text-sm text-muted-foreground list-decimal pl-5 space-y-1">
                <li>Tekan tombol reset pada ESP32</li>
                <li>Tunggu hingga ESP32 masuk ke mode AP (Access Point)</li>
                <li>Hubungkan ke jaringan WiFi dengan nama "ESP32_Recovery"</li>
                <li>Buka browser dan akses 192.168.4.1</li>
                <li>Masukkan pengaturan WiFi yang benar</li>
              </ol>
            </div>
            
            <div className="p-4 border rounded-md bg-muted">
              <h3 className="font-medium mb-2">Status Koneksi</h3>
              <div className="flex items-center gap-2">
                {deviceStatus === 'online' ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-green-600">ESP32 terhubung dan online</span>
                  </>
                ) : deviceStatus === 'offline' ? (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-red-600">ESP32 tidak terhubung (offline)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-yellow-600">Status tidak diketahui</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}