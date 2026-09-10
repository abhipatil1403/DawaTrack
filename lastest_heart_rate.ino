//MAX30102 ESP32 Supabase Data Logger
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <ArduinoJson.h>

// Pin definitions
#define SDA_PIN 21
#define SCL_PIN 22
#define INT_PIN 19

#define REPORTING_PERIOD_MS     1000

float BPM, SpO2;

/*WiFi credentials*/
// Set these locally before flashing the ESP32. Do not commit real credentials.
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Supabase credentials - replace with your own
const char* supabaseUrl = "https://illirjtiwudwybtxvvbf.supabase.co";
const char* supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlsbGlyanRpd3Vkd3lidHh2dmJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyNzIxNTQsImV4cCI6MjA1NDg0ODE1NH0.WH-ZdjR9yvv1iii8pgGIi1IiCxT2hUyF1dyRrHXNG10";

// Variables for heart rate calculation
const byte RATE_SIZE = 8; // Increased for more averaging and stability
byte rates[RATE_SIZE]; // Array of heart rates
byte rateSpot = 0;
long lastBeat = 0; // Time at which the last beat occurred
float beatsPerMinute;
byte beatAvg;

// For finger detection
boolean fingerPresent = false;
int irThreshold = 30000; // Threshold for finger detection

// Create a MAX30105 object
MAX30105 particleSensor;
uint32_t tsLastReport = 0;

// Callback function for beat detection
void onBeatDetected() {
  Serial.println("Beat detected!");
}

void setup() {
  Serial.begin(115200);
  delay(1000);  // Give time for serial to initialize

  // Initialize I2C with custom pins for ESP32
  Wire.begin(SDA_PIN, SCL_PIN);
  
  Serial.println("\n\nStarting Heart Rate Monitor...");
  Serial.println("Connecting to ");
  Serial.println(ssid);

  // Disconnect from any previous WiFi connection
  WiFi.disconnect(true);
  delay(1000);
  
  // Set WiFi mode
  WiFi.mode(WIFI_STA);
  
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  // Connect to your local WiFi network
  WiFi.begin(ssid, password);
  
  // Check if WiFi is connected
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
    
    // Print WiFi status for debugging
    if (attempts % 5 == 0) {
      switch(WiFi.status()) {
        case WL_IDLE_STATUS:
          Serial.println("WiFi status: Idle");
          break;
        case WL_NO_SSID_AVAIL:
          Serial.println("WiFi status: SSID not found");
          break;
        case WL_CONNECT_FAILED:
          Serial.println("WiFi status: Connection failed");
          break;
        case WL_CONNECTION_LOST:
          Serial.println("WiFi status: Connection lost");
          break;
        case WL_DISCONNECTED:
          Serial.println("WiFi status: Disconnected");
          break;
      }
    }
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength (RSSI): ");
    Serial.println(WiFi.RSSI());
  } else {
    Serial.println("\nFailed to connect to WiFi!");
    Serial.println("Please check:");
    Serial.println("1. WiFi credentials are correct");
    Serial.println("2. WiFi router is in range");
    Serial.println("3. WiFi router is powered on");
  }
  
  Serial.println("Ready to send data to Supabase...");
  
  // Initialize the MAX30102 sensor
  Serial.print("Initializing MAX30102 sensor...");

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("FAILED");
    Serial.println("Check your wiring and make sure the sensor is connected properly.");
    while(1) {
      delay(1000);
      Serial.println("Still waiting for MAX30102...");
    }
  } else {
    Serial.println("SUCCESS");
    // Configure the sensor with optimal settings for heart rate monitoring
    byte ledBrightness = 60; // Options: 0=Off to 255=50mA
    byte sampleAverage = 4; // Options: 1, 2, 4, 8, 16, 32
    byte ledMode = 2; // Options: 1=Red only, 2=Red+IR, 3=Red+IR+Green
    byte sampleRate = 100; // Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
    int pulseWidth = 411; // Options: 69, 118, 215, 411
    int adcRange = 4096; // Options: 2048, 4096, 8192, 16384
    
    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeRed(0x0A); // Turn Red LED to low to indicate sensor is running
    particleSensor.setPulseAmplitudeIR(0x2A); // Set IR LED to higher power for better readings
    particleSensor.setPulseAmplitudeGreen(0); // Turn off Green LED
  }
}
void loop() {
  // Debug logging at regular intervals
  static unsigned long lastDebugPrint = 0;
  if (millis() - lastDebugPrint > 5000) { // Every 5 seconds
    Serial.print("WiFi status: ");
    Serial.println(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
    Serial.print("Finger present: ");
    Serial.println(fingerPresent ? "Yes" : "No");
    Serial.print("BPM value: ");
    Serial.println(BPM);
    lastDebugPrint = millis();
  }
  
  // Get IR value
  long irValue = particleSensor.getIR();
  
  // Check if a finger is present based on IR value
  if (irValue > irThreshold) {
    // Finger is present
    if (!fingerPresent) {
      Serial.println("Finger detected!");
      fingerPresent = true;
      // Reset heart rate calculation when finger is first detected
      for (byte i = 0; i < RATE_SIZE; i++) {
        rates[i] = 0;
      }
      rateSpot = 0;
      lastBeat = 0;
    }
    
    // Check for a heartbeat
    if (checkForBeat(irValue)) {
      // We sensed a beat
      long delta = millis() - lastBeat;
      lastBeat = millis();
      
      // Calculate BPM only if we have a reasonable delta time
      if (delta > 0) {
        beatsPerMinute = 60 / (delta / 1000.0);
        
        // Filter out unreasonable values
        if (beatsPerMinute < 220 && beatsPerMinute > 40) {
          rates[rateSpot++] = (byte)beatsPerMinute; // Store this reading in the array
          rateSpot %= RATE_SIZE; // Wrap variable
          
          // Take average of readings
          beatAvg = 0;
          int validRates = 0;
          for (byte x = 0; x < RATE_SIZE; x++) {
            if (rates[x] > 0) {
              beatAvg += rates[x];
              validRates++;
            }
          }
          
          // Only update if we have valid rates
          if (validRates > 0) {
            beatAvg /= validRates;
            // Update our values
            BPM = beatAvg;
            onBeatDetected(); // Call the beat detection callback
          }
        }
      }
    }
    
    // Simple SpO2 estimation (this is not medically accurate)
    // For a proper SpO2 calculation, you would need red LED readings and more complex algorithms
    SpO2 = map(constrain(irValue, irThreshold, 300000), irThreshold, 300000, 90, 99);
  } else {
    // No finger detected
    if (fingerPresent) {
      Serial.println("Finger removed");
      fingerPresent = false;
    }
    BPM = 0;
    SpO2 = 0;
  }
  
  // Update readings at the reporting interval
  if (millis() - tsLastReport > REPORTING_PERIOD_MS) {
    Serial.print("IR Value: ");
    Serial.println(irValue);
    Serial.print("BPM: ");
    Serial.println(BPM);
    Serial.print("SpO2: ");
    Serial.print(SpO2);
    Serial.println("%");
    Serial.println("*********************************");
    Serial.println();
    
    // Check WiFi connection and reconnect if needed
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi connection lost. Attempting to reconnect...");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(ssid, password);
      
      // Wait up to 10 seconds for reconnection
      int reconnectAttempts = 0;
      while (WiFi.status() != WL_CONNECTED && reconnectAttempts < 10) {
        delay(1000);
        Serial.print(".");
        reconnectAttempts++;
      }
      
      if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi reconnected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
      } else {
        Serial.println("\nFailed to reconnect to WiFi.");
      }
    }
    
    // Send data to Supabase if we have valid readings and WiFi is connected
    static unsigned long lastSupabaseUpdate = 0;
    if (BPM > 0 && SpO2 > 0) {
      if (WiFi.status() == WL_CONNECTED) {
        // Only send data every 5 seconds to avoid overwhelming Supabase
        if (millis() - lastSupabaseUpdate > 5000) {
          sendDataToSupabase(BPM, SpO2);
          lastSupabaseUpdate = millis();
        }
      } else {
        Serial.println("Cannot send data: WiFi not connected");
      }
    } else {
      Serial.println("No valid readings to send");
    }
    
    tsLastReport = millis();
  }


}



// Function to send data to Supabase
void sendDataToSupabase(float heartRate, float spO2) {
  Serial.println("Sending data to Supabase...");
  
  // Create a JSON document
  DynamicJsonDocument doc(1024);
  doc["heart_rate"] = heartRate;
  doc["spo2"] = spO2;
  doc["timestamp"] = "now()"; // Use Postgres NOW() function for server-side timestamp
  
  // Serialize JSON to string
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  Serial.print("Payload: ");
  Serial.println(jsonPayload);
  
  HTTPClient http;
  
  // Endpoint for inserting a new row
  String endpoint = String(supabaseUrl) + "/rest/v1/sensor_readings";
  http.begin(endpoint);
  
  // Headers required for Supabase
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Prefer", "return=minimal"); // Don't need the response body
  
  // Set timeout
  http.setTimeout(10000); // 10 second timeout
  
  // Send POST request to insert a new row
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    if (httpResponseCode == 200 || httpResponseCode == 201 || httpResponseCode == 204) {
      Serial.println("Data sent successfully to Supabase! Response code: " + String(httpResponseCode));
      Serial.println("New reading inserted into Supabase!");
    } else {
      Serial.println("Unexpected response code: " + String(httpResponseCode));
      
      // Get error response
      String response = http.getString();
      if (response.length() < 100) {
        Serial.println("Response: " + response);
      } else {
        Serial.println("Response received (too long to display)");
      }
    }
  } else {
    Serial.print("Error sending HTTP POST request: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  
  // Reset WiFi connection to prevent memory issues
  WiFi.disconnect(false);
  delay(100);
  WiFi.begin(ssid, password);
  delay(500);
}

// Function to create the initial row in Supabase
void createInitialRow(float heartRate, float spO2) {
  Serial.println("Creating initial row in Supabase...");
  
  // Create a JSON document
  DynamicJsonDocument doc(1024);
  doc["id"] = 1; // Fixed ID for the single row
  doc["heart_rate"] = heartRate;
  doc["spo2"] = spO2;
  
  // Serialize JSON to string
  String jsonPayload;
  serializeJson(doc, jsonPayload);
  
  HTTPClient http;
  
  // Endpoint for creating a new row
  String endpoint = String(supabaseUrl) + "/rest/v1/sensor_readings";
  http.begin(endpoint);
  
  // Headers required for Supabase
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", supabaseKey);
  http.addHeader("Authorization", "Bearer " + String(supabaseKey));
  http.addHeader("Prefer", "resolution=merge-duplicates");
  
  // Send POST request to create the row
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      Serial.println("Initial row created successfully! Response code: " + String(httpResponseCode));
    } else {
      Serial.println("Unexpected response code when creating row: " + String(httpResponseCode));
    }
  } else {
    Serial.print("Error creating initial row: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
  
  // Reset WiFi connection to prevent memory issues
  WiFi.disconnect(false);
  delay(100);
  WiFi.begin(ssid, password);
  delay(500);
}
