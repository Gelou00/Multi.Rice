#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <WiFiClientSecure.h>


const char* WIFI_SSID = "Galaxy A54";
const char* WIFI_PASS = "qwerty123";

const char* API_URL = "https://xlgjn5k1-5000.asse.devtunnels.ms/api";

const int JSON_REQUEST_SIZE = 512 + (64 * 15);

const String deviceID="10001a";

float temperature;
float humidity;
int tankLevel;
int isRaining;
int isIrrigating;

String arduinoMessage;

unsigned long previousOnlineUpdate;
unsigned long currentTime;

unsigned long previousDataSubmit;

bool connectedToWifi;

int loopCounter;

void wifiConnect() {
    Serial.print("Connecting to WiFi: ");
    Serial.println(WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 30) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\nWiFi connected.");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        connectedToWifi=true;
    } else {
      Serial.println("\nFailed to connect to WiFi disabling wifi connection...");
        //Serial.println("\nFailed to connect to WiFi. Restarting...");
        //delay(5000);
        //ESP.restart();
        connectedToWifi=false;
    }
    Serial.println("------------------------------------");
}

void requestAPIGET(String endPoint) {
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected. Reconnecting...");
        wifiConnect();
        return;
    }
        
    String urlFull=API_URL+endPoint;
    HTTPClient http;
    http.begin(urlFull);

    http.addHeader("Content-Type", "application/json");

    int httpResponseCode = http.GET();

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("HTTP Response Code: %d\n", httpResponseCode);
        
        DynamicJsonDocument responseDoc(1024);
        DeserializationError error = deserializeJson(responseDoc, response);

        if (error) {
            Serial.print(F("JSON parsing failed: "));
            Serial.println(error.f_str());
        } else {
            if (httpResponseCode == 200) {
                String message = responseDoc["message"];
                Serial.println(message.c_str());
            } else {
                String errorMsg = responseDoc["message"] | "Unknown API Error";
                Serial.printf("API Error: %s\n", errorMsg.c_str());
            }
        }
    } else {
        Serial.printf("HTTP GET Request failed, error: %s\n", http.errorToString(httpResponseCode).c_str());
    }

    http.end();
}

void sendOnlinePing(){
    Serial.println("Sending post");
    DynamicJsonDocument doc(JSON_REQUEST_SIZE);
    doc["deviceID"]=deviceID;
    doc["temperature"]=temperature;
    doc["humidity"]=humidity;
    doc["tankLevel"]=tankLevel;
    doc["isRaining"]=isRaining;
    doc["isIrrigating"]=isIrrigating;
    sendAPIPOST("/device/online", doc);
}

void sendDataSubmission(){
    DynamicJsonDocument doc(JSON_REQUEST_SIZE);
    doc["deviceID"]=deviceID;
    doc["temperature"]=temperature;
    doc["humidity"]=humidity;
    doc["tankLevel"]=tankLevel;
    doc["isRaining"]=isRaining;
    doc["isIrrigating"]=isIrrigating;
    sendAPIPOST("/event/submit-data", doc);
}

void sendAPIPOST(String endPoint, DynamicJsonDocument doc){
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected. Reconnecting...");
        wifiConnect();
        return;
    }

    String urlFull = API_URL + endPoint;

    String jsonRequest;
    serializeJson(doc, jsonRequest);

    HTTPClient http;

    WiFiClientSecure client;
    client.setInsecure();

    if (!http.begin(client, urlFull)) {
        Serial.println("Failed to begin HTTP connection!");
        return;
    }

    http.addHeader("Content-Type", "application/json");

    
    int httpResponseCode = http.POST(jsonRequest);

    if (httpResponseCode > 0) {
        Serial.printf("HTTP Response Code: %d\n", httpResponseCode);

        String response = http.getString();
        Serial.println("Raw Response:");
        Serial.println(response);

        DynamicJsonDocument responseDoc(1024);
        DeserializationError error = deserializeJson(responseDoc, response);

        if (error) {
            Serial.print("JSON parsing failed: ");
            Serial.println(error.c_str());
        } else {
            const char* message = responseDoc["message"] | "No message";
            Serial.printf("Server Message: %s\n", message);
        }

    } else {
        Serial.printf("HTTP Request failed: %s\n",
                      http.errorToString(httpResponseCode).c_str());
    }

    http.end();
}

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);

  delay(100);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  wifiConnect();

  temperature=0;
  humidity=0;
  arduinoMessage="";
  previousOnlineUpdate=0;
  currentTime=0;

  connectedToWifi=false;

  loopCounter=0;
  tankLevel=0;
  isRaining=0;
  isIrrigating=0;
  previousDataSubmit=0;
}

void loop() {
  if (Serial2.available()) {
    String message = Serial2.readStringUntil('\n');
    if(!arduinoMessage.equals(message) || loopCounter>=4){
      int firstComma = message.indexOf(',');
      int secondComma = message.indexOf(',', firstComma + 1);
      int thirdComma = message.indexOf(',', secondComma+1);
      int fourthComma = message.indexOf(',', thirdComma+1);

      humidity = message.substring(0, firstComma).toFloat();
      //Serial.println(humidity);
      temperature=message.substring(firstComma+1, secondComma).toFloat();
      //Serial.println(temperature);
      tankLevel=message.substring(secondComma+1, thirdComma).toInt();
      //Serial.println(tankLevel);
      isRaining=message.substring(thirdComma+1, fourthComma).toInt();
      //Serial.println(isRaining);
      isIrrigating=message.substring(fourthComma+1).toInt();
      //Serial.println(isIrrigating);
      Serial.println("From arduino: "+message);
      arduinoMessage=message;
      loopCounter=0;
    }else{
      loopCounter++;
    }
  }

  currentTime=millis();
  if((currentTime-previousOnlineUpdate) >= 6000){
    Serial.println("Check!");
    
      sendOnlinePing();
    
    previousOnlineUpdate=currentTime;
  }

  if(currentTime-previousDataSubmit >= 43200000 || previousDataSubmit<=0){
      sendDataSubmission();
    previousDataSubmit=currentTime;
  }
  
  delay(2000);
}