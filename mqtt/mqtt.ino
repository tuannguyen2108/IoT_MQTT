#include <WiFi.h>
#include <WiFiClient.h>
#include <string.h>
#include <Wire.h>
#include "DHT.h"
#include <PubSubClient.h>
#include <stdio.h>
#include <stdlib.h>

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// DHT define
#define DHTTYPE DHT11   // DHT 11
#define DHTPIN 4
DHT dht(DHTPIN, DHTTYPE);

// PIN define
#define LED 14
#define pump 13

const int PIN_in1 = 33;
const int PIN_in2 = 32;

const int PIN_doAmDat = 34;
const int PIN_camBienMua = 15;
const int PIN_camBienAnhSang = 35;

int button1, button2, button3;
float t = 0.0;
float h = 0.0;
int humi = 0; 
int percent = 0;
int doAmDat = 0;
int light = 0; 
int rain = 0;
int trangThaiMayBom = 0;
int trangThaiDen = 0;
int trangThaiRem = 0;
int mode = 1;
int ref = 30;

// Thông tin mạng WiFi muốn kết nối
// const char *ssid  = "San Bong Da Ngoc Thach 5GHz";
// const char *password = "k4/43khongcomatkhau";
// const char *ssid = "wifi";
// const char *password = "12345678";
const char *ssid = "Tiem Giay 2hand";
const char *password = "0799423557";

// Thông tin MQTT Broker kết nối
// char *mqttServer = "esp32webserver.cloud.shiftr.io";
char *mqttServer = "mqtt-dashboard.com";
int mqttPort = 1883;
const char *mqttUser = "esp32webserver";
const char *mqttPassword = "GUI7C1I3bnkqHUcR";

void callback(char *topic, byte *message, unsigned int length)
{
  String Strmessage;
  Serial.print("Callback - ");
  Serial.print("Topic: ");
  Serial.print(topic);
  Serial.print("Message: ");
  for (int i = 0; i < length; i++)
  {
    Strmessage += (char)message[i];
  }
  Serial.println(Strmessage);
  int new_ref = atoi(Strmessage.c_str());
  // Kiểm tra nếu nhận được tin nhắn "Bat 1" trên topic "ESP8266_read_data"
  if (String(topic) == "esp32/mode" && Strmessage == "AUTO ON") {
    mode = 0;
  } 
  
  else if (String(topic) == "esp32/mode" && Strmessage == "AUTO OFF") {
    mode = 1;
  } 
  
  else if (String(topic) == "esp32/pump" && Strmessage == "PUMP ON") {
    batBomNuoc();
  } 
  
  else if (String(topic) == "esp32/pump" && Strmessage == "PUMP OFF") {
    tatBomNuoc();
  } 
  
  else if (String(topic) == "esp32/bulb" && Strmessage == "BULB ON") {
    batDen();
  }
  
  else if (String(topic) == "esp32/bulb" && Strmessage == "BULB OFF") {
    tatDen();
  } 
  
  else if (String(topic) == "esp32/curtain" && Strmessage == "CURTAIN ON") {
    cheRem();
  } 
  
  else if (String(topic) == "esp32/curtain" && Strmessage == "CURTAIN OFF") {
    thuRem();
  }

  else if (strcmp(topic, "esp32/soil") == 0) {
    ref = new_ref;
  }
}

void setupMQTT()
{
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(callback);
}

void reconnect()
{
  // Kết nối MQTT broker lại sau khi mất kết nối
  Serial.println("Connecting to MQTT Broker...");
  while (!mqttClient.connected())
  {
    Serial.println("Reconnecting to MQTT Broker...");
    String clientId = "ESP32send";
    if (mqttClient.connect("ESP32send", mqttUser, mqttPassword))
    {
      Serial.println("Connected.");
      // subscribe to topic
      mqttClient.subscribe("esp32/pump");
      mqttClient.subscribe("esp32/bulb");
      mqttClient.subscribe("esp32/curtain");
      mqttClient.subscribe("esp32/mode");
      mqttClient.subscribe("esp32/soil");
    }
  }
}

void setup()
{
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Connected to Wi-Fi");
  dht.begin();
  
  pinMode(PIN_doAmDat, INPUT);
  pinMode(PIN_camBienAnhSang, INPUT);
  pinMode(PIN_camBienMua, INPUT);
  pinMode(LED, OUTPUT);
  pinMode(pump, OUTPUT);
  pinMode(PIN_in1, OUTPUT);
  pinMode(PIN_in2, OUTPUT);

  setupMQTT();
}

void docGiaTriDHT() {
  //Read Temp
  t = dht.readTemperature();
  // Read Humi
  h = dht.readHumidity();
  //Check isRead ?
  if (isnan(h) || isnan(t)) {
    // delay(500);
    Serial.println("Failed to read data sensor!\n");
    return;
  }
  Serial.print("\n");
  Serial.print("Độ ẩm không khí: " + String(h) + "%");
  Serial.print("\t");
  Serial.print("Nhiệt độ: " + String(t) + " C");
}

int docGiaTriDoAmDat() {
  humi = analogRead(PIN_doAmDat);
  percent = map(humi, 0, 4095, 0, 100);  // đưa về thang đo 0-100%
  doAmDat = 100 - percent;
  // Kiểm tra giá trị hợp lệ của doAmDat
  if (isnan(doAmDat)) {
    // delay(500);
    Serial.println("Failed to read valid data sensor!\n");
    return -1; 
  }

  return doAmDat;
}

String docGiaTriCamBienAnhSang() { //Có ánh sáng = 0; Tối = 1
  light = digitalRead(PIN_camBienAnhSang);
  if (isnan(light)) {
    // delay(500);
    Serial.println("Failed to read data sensor!\n");
    return "NO SENSOR";
  }  
  if (light == 0){
    return "SÁNG";
  }
  if (light == 1){
    return "TỐI";
  }
  // Serial.println("Cảm biến ánh sáng: " + String(light));
}

String docGiaTriCamBienMua() { //Khô ráo = 1; Mưa = 0
  rain = digitalRead(PIN_camBienMua);
  if (isnan(rain)) {
    // delay(500);
    Serial.println("Failed to read data sensor!\n");
    return "undefined";
  } 
  // Serial.println("Cảm biến mưa: " + String(rain));
  if (rain == 0) {
    return "MƯA";
  }
  if (rain == 1) {
    return "KHÔNG MƯA";
  }
}

void batBomNuoc() {
  digitalWrite(pump, HIGH);  // Bật máy bơm nước
  Serial.println("Máy bơm đã bật");
  trangThaiMayBom = 1;
}

void tatBomNuoc() {
    digitalWrite(pump, LOW);  // Tắt máy bơm nước
    Serial.println("Máy bơm đã tắt");
    trangThaiMayBom = 0;
}

String pumpStatus(){
  if(trangThaiMayBom == 1){
    return "BẬT";
  }
  if(trangThaiMayBom == 0){
    return "TẮT";
  }
}

void batDen() {
  digitalWrite(LED, HIGH);  // Bật đèn
  Serial.println("Đèn đã bật");
  trangThaiDen = 1;
}

void tatDen() {
  digitalWrite(LED, LOW);  // Tắt đèn
  Serial.println("Đèn đã tắt");
  trangThaiDen = 0;
}

String bulbStatus() {
  if(trangThaiDen == 1){
    return "BẬT";
  }
  if(trangThaiDen == 0){
    return "TẮT";
  }
}

void thuRem() {  // Nguồn motor 12V
  if (trangThaiRem == 1) {
    digitalWrite(PIN_in1, HIGH);
    digitalWrite(PIN_in2, LOW);
    // delay(11000);
    digitalWrite(PIN_in1, LOW);
    digitalWrite(PIN_in2, LOW);
  }
  trangThaiRem = 0;
  Serial.println("Rèm đã thu");
}

void cheRem() { //Nguồn motor 12V
  if (trangThaiRem == 0) {
    digitalWrite(PIN_in1, LOW);
    digitalWrite(PIN_in2, HIGH);
    // delay(11000);
    digitalWrite(PIN_in1, LOW);
    digitalWrite(PIN_in2, LOW);
  }
  trangThaiRem = 1;
  Serial.println("Rèm đã che");
}

String curtainStatus() {
  if(trangThaiRem == 1){
    return "CHE";
  }
  if(trangThaiRem == 0){
    return "THU";
  }
}

void changeMode(){
  if (mode == 0) { //mode Auto
    if (doAmDat < ref) { //Vượt ngưỡng
      batBomNuoc(); //Bật bơm nước 
    }
    else { //Trong ngưỡng
      tatBomNuoc(); //Tắt bơm nước
    }
    if (light == 1) {
      batDen(); //Bật đèn
    }
    else {
      tatDen(); //Tắt đèn
    }
    if (rain == 0 && trangThaiRem == 0) {  // nếu trời mưa và rèm chưa kéo thì kéo rèm
      cheRem();
    } 
    else {
      if (rain == 1 && trangThaiRem == 1) {  // nếu trời không mưa và rèm đã kéo thì thu rèm
        thuRem();
      }
    }
  }
}

String modeStatus() {
  if(mode == 0){
    return "BẬT";
  }
  if(mode == 1){
    return "TẮT";
  }
}

String refValue(){
  String ref_Value = String(ref);
  return ref_Value;
}

String create_Json(){
  float temperature = dht.readTemperature(); // Đọc nhiệt độ từ cảm biến DHT
  float humidity = dht.readHumidity();       // Đọc độ ẩm từ cảm biến DHT
  String temperatureStr = String(temperature);
  String humidityStr = String(humidity);
  String soil_humidity = String(docGiaTriDoAmDat());
  String light_status = docGiaTriCamBienAnhSang();
  String rain_status = docGiaTriCamBienMua();
  String pump_status = pumpStatus();
  String bulb_status = bulbStatus();
  String curtain_status = curtainStatus();
  String mode_status = modeStatus();
  String ref_value = refValue();
  String json = "{\"Temperature\": \"" + temperatureStr + "\",\"Humidity\": \"" + humidityStr + "\",\"Soil_Humidity\": \"" + soil_humidity + "\" , \"Rain_Status\": \"" + rain_status + "\",\"Light_Status\": \"" + light_status + "\",\"Pump_Status\": \"" + pump_status + "\",\"Bulb_Status\": \"" + bulb_status + "\", \"Curtain_Status\": \"" + curtain_status + "\",\"Mode_Status\": \"" + mode_status + "\",\"Ref_Value\": \"" + ref_value + "\"}";
  return json;
}

void loop()
{
  docGiaTriDHT();
  docGiaTriDoAmDat();
  docGiaTriCamBienAnhSang();
  docGiaTriCamBienMua();
  // delay(500);
  changeMode();
  //=============================
  if (!mqttClient.connected())
    reconnect();
  mqttClient.loop();
  long now = millis();
  static long previous_time = 0;

  if (now - previous_time > 150)
  {
    previous_time = now;
    String Json = create_Json();
    mqttClient.publish("esp32/temp", Json.c_str()); // Topic
  }
}