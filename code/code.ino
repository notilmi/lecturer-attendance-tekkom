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
  
  // Initialize EEPROM
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
  Serial.println(F("RFID Attendance System with Check-in/Check-out"));

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
}

bool logPresenceToFirebase(String uid, bool isCheckIn) {
  String date = getDateOnly();
  String currentTime = getTimeOnly();
  String path = String(FIREBASE_HOST) + "/presence/" + date + "/" + uid + ".json?auth=" + FIREBASE_API_KEY;
  
  // First, get current data if exists
  PresenceStatus currentStatus = getPresenceStatus(uid);
  
  HTTPClient http;
  http.begin(path);
  http.addHeader("Content-Type", "application/json");
  
  String jsonData;
  if (isCheckIn) {
    // Check-in data
    jsonData = "{\"uid\":\"" + uid + "\",\"tanggal\":\"" + date + "\",\"status\":\"masuk\",\"checkInTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
  } else {
    // Check-out data, preserve check-in time if exists
    if (currentStatus.exists && currentStatus.checkInTime != "") {
      jsonData = "{\"uid\":\"" + uid + "\",\"tanggal\":\"" + date + "\",\"status\":\"pulang\",\"checkInTime\":\"" + currentStatus.checkInTime + "\",\"checkOutTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
    } else {
      jsonData = "{\"uid\":\"" + uid + "\",\"tanggal\":\"" + date + "\",\"status\":\"pulang\",\"checkOutTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
    }
  }
  
  int httpCode = http.PUT(jsonData);

  bool success = false;
  if (httpCode == HTTP_CODE_OK) {
    Serial.println("Presence logged successfully");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(isCheckIn ? "Check-in" : "Check-out");
    lcd.setCursor(0, 1);
    lcd.print("Success: ");
    lcd.print(currentTime);
    success = true;
  } else {
    Serial.println("Failed to log presence: HTTP " + String(httpCode));
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Log Failed");
    lcd.setCursor(0, 1);
    lcd.print("Error: ");
    lcd.print(httpCode);
    success = false;
  }
  
  http.end();
  delay(2000);
  return success;
}

// Update lecturer status in Firebase
bool updateLecturerStatus(String uid, bool isCheckIn) {
  // First find lecturer with this RFID
  HTTPClient http;
  String path = String(FIREBASE_HOST) + "/lecturers.json?auth=" + FIREBASE_API_KEY;
  
  http.begin(path);
  int httpCode = http.GET();
  
  String lecturerId = "";
  String lecturerName = "";
  String lecturerCode = "";
  
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    // Find matching lecturer with this RFID UID
    int startIdx = 0;
    while (true) {
      // Find the next rfidUid occurrence
      int uidPos = payload.indexOf("\"rfidUid\":\"" + uid + "\"", startIdx);
      if (uidPos == -1) break;
      
      // Search backwards to find the object ID (key)
      int keyPos = payload.lastIndexOf("\"", uidPos - 2);
      if (keyPos == -1) break;
      
      // Extract the key
      int keyStart = payload.lastIndexOf("\"", keyPos - 1);
      if (keyStart == -1) break;
      
      lecturerId = payload.substring(keyStart + 1, keyPos);
      
      // Try to extract name
      String nameSearchStr = "\"name\":\"";
      int namePos = payload.indexOf(nameSearchStr, keyStart);
      if (namePos != -1 && namePos < uidPos + 50) {
        namePos += nameSearchStr.length();
        int nameEndPos = payload.indexOf("\"", namePos);
        if (nameEndPos != -1) {
          lecturerName = payload.substring(namePos, nameEndPos);
        }
      }
      
      // Try to extract lecturer code
      String codeSearchStr = "\"lecturerCode\":\"";
      int codePos = payload.indexOf(codeSearchStr, keyStart);
      if (codePos != -1 && codePos < uidPos + 50) {
        codePos += codeSearchStr.length();
        int codeEndPos = payload.indexOf("\"", codePos);
        if (codeEndPos != -1) {
          lecturerCode = payload.substring(codePos, codeEndPos);
        }
      }
      
      break; // Found the lecturer
    }
    
    startIdx = uidPos + 10;
  }
  
  http.end();
  
  if (lecturerId.isEmpty()) {
    Serial.println("No lecturer found with this RFID");
    return false;
  }
  
  // Update lecturer status
  String statusPath = String(FIREBASE_HOST) + "/lecturers/" + lecturerId + ".json?auth=" + FIREBASE_API_KEY;
  String status = isCheckIn ? "masuk" : "pulang";
  String updateData = "{\"status\":\"" + status + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
  
  HTTPClient httpUpdate;
  httpUpdate.begin(statusPath);
  httpUpdate.addHeader("Content-Type", "application/json");
  
  int updateCode = httpUpdate.PATCH(updateData);
  bool success = (updateCode == HTTP_CODE_OK);
  
  httpUpdate.end();
  
  // Log in lecturer_presence
  if (success && !lecturerName.isEmpty()) {
    String date = getDateOnly();
    String currentTime = getTimeOnly();
    String historyPath = String(FIREBASE_HOST) + "/lecturer_presence/" + date + "/" + lecturerId + ".json?auth=" + FIREBASE_API_KEY;
    
    // Check if there's existing data
    HTTPClient httpGet;
    httpGet.begin(historyPath);
    int getCode = httpGet.GET();
    String existingData = "";
    String checkInTime = "";
    
    if (getCode == HTTP_CODE_OK) {
      existingData = httpGet.getString();
      // Extract check-in time if exists
      int checkInPos = existingData.indexOf("\"checkInTime\":\"");
      if (checkInPos != -1) {
        checkInPos += 14; // Length of "checkInTime":"
        int checkInEndPos = existingData.indexOf("\"", checkInPos);
        if (checkInEndPos != -1) {
          checkInTime = existingData.substring(checkInPos, checkInEndPos);
        }
      }
    }
    
    httpGet.end();
    
    // Prepare history data
    String historyData;
    if (isCheckIn) {
      historyData = "{\"name\":\"" + lecturerName + "\",\"lecturerCode\":\"" + lecturerCode + "\",\"time\":" + String(timeClient.getEpochTime() * 1000) + ",\"status\":\"" + status + "\",\"checkInTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
    } else {
      // For check-out, preserve check-in time if exists
      if (!checkInTime.isEmpty()) {
        historyData = "{\"name\":\"" + lecturerName + "\",\"lecturerCode\":\"" + lecturerCode + "\",\"time\":" + String(timeClient.getEpochTime() * 1000) + ",\"status\":\"" + status + "\",\"checkInTime\":\"" + checkInTime + "\",\"checkOutTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
      } else {
        historyData = "{\"name\":\"" + lecturerName + "\",\"lecturerCode\":\"" + lecturerCode + "\",\"time\":" + String(timeClient.getEpochTime() * 1000) + ",\"status\":\"" + status + "\",\"checkOutTime\":\"" + currentTime + "\",\"lastUpdated\":" + String(timeClient.getEpochTime() * 1000) + "}";
      }
    }
    
    HTTPClient httpHistory;
    httpHistory.begin(historyPath);
    httpHistory.addHeader("Content-Type", "application/json");
    
    int historyCode = httpHistory.PUT(historyData);
    httpHistory.end();
    
    return (historyCode == HTTP_CODE_OK);
  }
  
  return success;
}

void loop() {
  // Recovery mode - don't do normal operations
  if (recoveryMode) {
    // In a real implementation, handle the recovery server here
    delay(100);
    return;
  }
  
  // Check if we need to send a heartbeat
  if (millis() - lastHeartbeatTime >= heartbeatInterval) {
    sendHeartbeat();
  }
  
  // Check for WiFi settings updates periodically
  if (millis() - lastSettingsCheckTime >= settingsCheckInterval) {
    checkWiFiSettings();
  }
  
  // Check for mode button press
  if (!registrationMode && digitalRead(MODE_BUTTON_PIN) == LOW) {
    delay(50); // Debounce
    if (digitalRead(MODE_BUTTON_PIN) == LOW) {
      // Button is pressed, toggle mode
      checkInMode = !checkInMode;
      updateModeDisplay();
      
      // Wait for button release
      while (digitalRead(MODE_BUTTON_PIN) == LOW) {
        delay(10);
      }
      delay(50); // Debounce on release
    }
  }
  
  // Check for RFID card
  if (!mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }

  if (!mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  String uid = getUIDString(mfrc522.uid.uidByte, mfrc522.uid.size);
  Serial.print(F("Card UID: "));
  Serial.println(uid);

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Card Detected");

  // Check if admin card is tapped
  if (uid == ADMIN_UID) {
    registrationMode = !registrationMode;
    Serial.println(registrationMode ? F("Entered registration mode") : F("Exited registration mode"));
    
    updateModeDisplay();
    delay(2000);
  } else if (registrationMode) {
    // In registration mode, register new cards
    if (isCardRegistered(uid)) {
      Serial.println(F("Card already registered"));
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Already Reg");
      delay(2000);
    } else {
      registerCardToFirebase(uid);
    }
  } else {
    // Normal mode, check if card is registered
    if (isCardRegistered(uid)) {
      Serial.println(F("Registered card detected"));
      lcd.setCursor(0, 1);
      lcd.print("Registered");
      delay(1000);
      
      // Get current presence status
      PresenceStatus status = getPresenceStatus(uid);
      
      if (checkInMode) { // Check-in mode
        if (status.exists && status.status == "masuk") {
          Serial.println(F("Already checked in today"));
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Already");
          lcd.setCursor(0, 1);
          lcd.print("Checked In");
          delay(2000);
        } else if (status.exists && status.status == "pulang") {
          Serial.println(F("Already checked out, cannot check in again"));
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Already");
          lcd.setCursor(0, 1);
          lcd.print("Checked Out");
          delay(2000);
        } else {
          // Proceed with check-in
          if (logPresenceToFirebase(uid, true)) {
            updateLecturerStatus(uid, true);
          }
        }
      } else { // Check-out mode
        if (!status.exists || status.status != "masuk") {
          Serial.println(F("Not checked in yet, cannot check out"));
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Not Checked In");
          lcd.setCursor(0, 1);
          lcd.print("Can't Check Out");
          delay(2000);
        } else if (status.exists && status.status == "pulang") {
          Serial.println(F("Already checked out today"));
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Already");
          lcd.setCursor(0, 1);
          lcd.print("Checked Out");
          delay(2000);
        } else {
          // Proceed with check-out
          if (logPresenceToFirebase(uid, false)) {
            updateLecturerStatus(uid, false);
          }
        }
      }
    } else {
      Serial.println(F("Unregistered card detected"));
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Unregistered");
      delay(2000);
    }
  }

  Serial.println(F("-------------------"));
  mfrc522.PICC_HaltA();
  
  // Return to ready state
  updateModeDisplay();
  delay(500);  // Short delay before next scan
}
