/*
  Updated RFID registration and presence logging with Firebase using HTTPClient
  Added WiFi settings update from Firebase and heartbeat functionality
  Supports check-in/check-out functionality for lecturers
*/

#include <MFRC522v2.h>
#include <MFRC522DriverSPI.h>
#include <MFRC522DriverPinSimple.h>
#include <MFRC522Debug.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>
#include <Preferences.h>

// Pin configuration for MFRC522
MFRC522DriverPinSimple ss_pin(5);
MFRC522DriverSPI driver{ss_pin};
MFRC522 mfrc522{driver};

// Firebase configuration
#define FIREBASE_HOST "https://presences-rfid-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_API_KEY "AIzaSyAem8OGmFLuLyAB0uElEvKomemcnG_t3to"

// WiFi credentials (default - will be updated from Firebase)
String wifi_ssid = "Dreamz_plus";
String wifi_password = "iniwifi123";

// Mode switch button
#define MODE_BUTTON_PIN 4  // D4 pin for mode select button
bool checkInMode = true;   // true = check-in mode, false = check-out mode

// Admin UID for entering/exiting registration mode
const char* ADMIN_UID = "53719013";
bool registrationMode = false;

// NTP configuration
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "jam.bmkg.go.id", 7 * 3600); // UTC+7 for WIB

// LCD configuration (16x2 I2C, address 0x27)
LiquidCrystal_I2C lcd(0x27, 16, 2); // Adjust address if needed (e.g., 0x3F)

// Preferences for storing WiFi credentials
Preferences preferences;

// Heartbeat timer
unsigned long lastHeartbeatTime = 0;
const unsigned long heartbeatInterval = 60000; // 1 minute

// WiFi settings check timer
unsigned long lastSettingsCheckTime = 0;
const unsigned long settingsCheckInterval = 300000; // 5 minutes

// Recovery mode flag
bool recoveryMode = false;

void setup() {
  Serial.begin(115200);
  while (!Serial);
  
  // Initialize EEPROM to store settings
  EEPROM.begin(512);
  
  // Initialize preferences
  preferences.begin("rfid-system", false);
  
  // Load WiFi credentials from preferences if available
  if (preferences.isKey("wifi_ssid") && preferences.isKey("wifi_password")) {
    wifi_ssid = preferences.getString("wifi_ssid", wifi_ssid);
    wifi_password = preferences.getString("wifi_password", wifi_password);
    Serial.println("Loaded WiFi credentials from preferences");
    Serial.println("SSID: " + wifi_ssid);
  }
  
  // Initialize button pin
  pinMode(MODE_BUTTON_PIN, INPUT_PULLUP);
  
  // Initialize LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("RFID System");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");
  delay(2000);

  // Initialize MFRC522
  mfrc522.PCD_Init();
  MFRC522Debug::PCD_DumpVersionToSerial(mfrc522, Serial);
  Serial.println(F("RFID Registration and Presence System with Check-in/Check-out"));

  // Connect to WiFi
  connectToWiFi();

  // Initialize NTP
  timeClient.begin();
  timeClient.update();
  Serial.print("Current NTP time: ");
  Serial.println(timeClient.getFormattedTime());
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("NTP Synced");
  delay(2000);

  // Default mode display
  updateModeDisplay();
  
  // Send initial heartbeat
  sendHeartbeat();
}

void connectToWiFi() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");
  Serial.print("Connecting to WiFi: ");
  Serial.println(wifi_ssid);
  
  WiFi.begin(wifi_ssid.c_str(), wifi_password.c_str());
  
  // Wait up to 20 seconds for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    lcd.setCursor(0, 1);
    lcd.print("Attempt: ");
    lcd.print(attempts + 1);
    attempts++;
  }
  
  // If connection failed, start recovery mode
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi. Starting recovery mode.");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed");
    lcd.setCursor(0, 1);
    lcd.print("Recovery Mode...");
    delay(2000);
    
    startRecoveryMode();
    return;
  }
  
  Serial.println("\nConnected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connected");
  lcd.setCursor(0, 1);
  lcd.print(WiFi.localIP());
  delay(2000);
}

void startRecoveryMode() {
  // This would set up an access point and web server for configuration
  // Implementation not shown here for brevity
  recoveryMode = true;
  
  // For this example, we'll just show a message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Recovery Mode");
  lcd.setCursor(0, 1);
  lcd.print("Reset to retry");
  
  // In a real implementation, you would:
  // 1. Set up an AP named "ESP32_Recovery"
  // 2. Start a web server on 192.168.4.1
  // 3. Serve a configuration page
  // 4. Accept new WiFi credentials
  // 5. Save them and restart
}

void updateModeDisplay() {
  lcd.clear();
  if (registrationMode) {
    lcd.setCursor(0, 0);
    lcd.print("Registration");
    lcd.setCursor(0, 1);
    lcd.print("Mode");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("Mode: ");
    lcd.print(checkInMode ? "CHECK-IN" : "CHECK-OUT");
    lcd.setCursor(0, 1);
    lcd.print("Scan Card");
  }
}

// Send heartbeat to Firebase
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot send heartbeat");
    return;
  }
  
  // Update device status in Firebase
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/settings/deviceStatus.json?auth=" + FIREBASE_API_KEY;
  
  http.begin(path);
  http.addHeader("Content-Type", "application/json");
  
  String jsonData = "{\"" + uid + "\":\"" + uid + "\"}";
  int httpCode = http.PATCH(jsonData);

  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Card registered successfully");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Card Registered");
    delay(2000);
    return true;
  } else {
    Serial.println("Failed to register: HTTP " + String(httpCode));
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Reg Failed");
    delay(2000);
    return false;
  }
}begin(path);
  http.addHeader("Content-Type", "application/json");
  
  String jsonData = "{\"lastHeartbeat\":" + String(timeClient.getEpochTime() * 1000) + 
                    ",\"ipAddress\":\"" + WiFi.localIP().toString() + "\"}";
  
  int httpCode = http.PATCH(jsonData);
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Heartbeat sent successfully");
  } else {
    Serial.println("Failed to send heartbeat: HTTP " + String(httpCode));
  }
  
  http.end();
  lastHeartbeatTime = millis();
}

// Check for WiFi settings updates from Firebase
void checkWiFiSettings() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot check settings");
    return;
  }
  
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/settings/wifi.json?auth=" + FIREBASE_API_KEY;
  
  http.begin(path);
  int httpCode = http.GET();
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("WiFi settings response: " + payload);
    
    // Simple parsing - in a real app, use a JSON library
    if (payload.indexOf("pendingUpdate") != -1 && payload.indexOf("pendingUpdate\":true") != -1) {
      Serial.println("New WiFi settings available");
      
      // Extract SSID
      int ssidStart = payload.indexOf("ssid\":\"") + 7;
      int ssidEnd = payload.indexOf("\"", ssidStart);
      String newSSID = payload.substring(ssidStart, ssidEnd);
      
      // Extract password
      int pwdStart = payload.indexOf("password\":\"") + 11;
      int pwdEnd = payload.indexOf("\"", pwdStart);
      String newPassword = payload.substring(pwdStart, pwdEnd);
      
      Serial.println("New SSID: " + newSSID);
      Serial.println("New Password: " + newPassword);
      
      // Only update if values actually changed
      if (newSSID != wifi_ssid || newPassword != wifi_password) {
        // Save new credentials to preferences
        preferences.putString("wifi_ssid", newSSID);
        preferences.putString("wifi_password", newPassword);
        
        // Update current values
        wifi_ssid = newSSID;
        wifi_password = newPassword;
        
        // Clear pending update flag
        clearPendingUpdate();
        
        // Show on LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("New WiFi Settings");
        lcd.setCursor(0, 1);
        lcd.print("Restart needed");
        delay(3000);
        
        // In a real application, you might want to restart automatically
        // ESP.restart();
      } else {
        // Clear flag even if no changes
        clearPendingUpdate();
      }
    }
  } else {
    Serial.println("Failed to check WiFi settings: HTTP " + String(httpCode));
  }
  
  http.end();
  lastSettingsCheckTime = millis();
}

// Clear the pending update flag
void clearPendingUpdate() {
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/settings/wifi/pendingUpdate.json?auth=" + FIREBASE_API_KEY;
  
  http.begin(path);
  http.addHeader("Content-Type", "application/json");
  
  String jsonData = "false";
  int httpCode = http.PUT(jsonData);
  
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Cleared pending update flag");
  } else {
    Serial.println("Failed to clear pending update flag: HTTP " + String(httpCode));
  }
  
  http.end();
}

String getUIDString(byte* uid, byte uidSize) {
  String uidStr = "";
  for (byte i = 0; i < uidSize; i++) {
    if (uid[i] < 0x10) uidStr += "0";
    uidStr += String(uid[i], HEX);
  }
  return uidStr;
}

String getDateOnly() {
  timeClient.update();
  unsigned long epochTime = timeClient.getEpochTime();
  if (epochTime < 946684800) { // Before 2000-01-01
    Serial.println("NTP sync failed, returning invalid date");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("NTP Error");
    delay(2000);
    return "1970-01-01"; // Fallback
  }
  time_t rawtime = epochTime;
  struct tm * ti;
  ti = localtime(&rawtime);
  char buffer[11];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d", ti);
  return String(buffer);
}

String getTimeOnly() {
  timeClient.update();
  return timeClient.getFormattedTime();
}

// Structure to hold presence status
struct PresenceStatus {
  bool exists;
  String status;
  String checkInTime;
  String checkOutTime;
};

PresenceStatus getPresenceStatus(String uid) {
  String date = getDateOnly();
  String path = String(FIREBASE_HOST) + "/presence/" + date + "/" + uid + ".json?auth=" + FIREBASE_API_KEY;
  
  HTTPClient http;
  http.begin(path);
  int httpCode = http.GET();
  
  PresenceStatus result = {false, "", "", ""};
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    Serial.println("Presence data: " + payload);
    
    if (payload != "null" && payload != "" && payload != "{}") {
      result.exists = true;
      
      // Basic parsing for status and times
      if (payload.indexOf("\"status\":\"masuk\"") != -1) {
        result.status = "masuk";
      } else if (payload.indexOf("\"status\":\"pulang\"") != -1) {
        result.status = "pulang";
      }
      
      // Extract check-in time if exists
      int checkInPos = payload.indexOf("\"checkInTime\":\"");
      if (checkInPos != -1) {
        checkInPos += 14; // Length of "checkInTime":"
        int checkInEndPos = payload.indexOf("\"", checkInPos);
        if (checkInEndPos != -1) {
          result.checkInTime = payload.substring(checkInPos, checkInEndPos);
        }
      }
      
      // Extract check-out time if exists
      int checkOutPos = payload.indexOf("\"checkOutTime\":\"");
      if (checkOutPos != -1) {
        checkOutPos += 15; // Length of "checkOutTime":"
        int checkOutEndPos = payload.indexOf("\"", checkOutPos);
        if (checkOutEndPos != -1) {
          result.checkOutTime = payload.substring(checkOutPos, checkOutEndPos);
        }
      }
    }
  } else {
    Serial.println("HTTP Code for presence check: " + String(httpCode));
  }
  
  http.end();
  return result;
}

bool isCardRegistered(String uid) {
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/rfid_register.json?auth=" + FIREBASE_API_KEY;
  
  http.begin(path);
  int httpCode = http.GET();

  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    http.end();
    String uidKey = "\"" + uid + "\"";
    return payload.indexOf(uidKey) != -1;
  }
  
  http.end();
  return false;
}

bool registerCardToFirebase(String uid) {
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/rfid_register.json?auth=" + FIREBASE_API_KEY;
  
  http.