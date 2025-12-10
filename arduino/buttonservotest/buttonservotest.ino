#include <Servo.h>

// === SERVO SETUP ===
Servo servo1;
Servo servo2;
Servo servo3;

int servoPin1 = 5;
int servoPin2 = 6;
int servoPin3 = 7;

// === BUTTON SETUP ===
int btn1 = 9;
int btn2 = 10;
int btn3 = 11;

// Toggle states
bool state1 = false;
bool state2 = false;
bool state3 = false;

// Last button states for edge detection
bool lastBtn1 = HIGH;
bool lastBtn2 = HIGH;
bool lastBtn3 = HIGH;

// Custom angles
int openAngle  = 160;
int closeAngle = 105;

void setup() {
  Serial.begin(9600);

  // Attach servos
  servo1.attach(servoPin1);
  servo2.attach(servoPin2);
  servo3.attach(servoPin3);

  // Buttons → internal pull-up
  pinMode(btn1, INPUT_PULLUP);
  pinMode(btn2, INPUT_PULLUP);
  pinMode(btn3, INPUT_PULLUP);

  // Initial servo positions (closed)
  servo1.write(closeAngle);
  servo2.write(closeAngle);
  servo3.write(closeAngle);
}

void loop() {

  // Read buttons
  bool b1 = digitalRead(btn1);
  bool b2 = digitalRead(btn2);
  bool b3 = digitalRead(btn3);

  // === BUTTON 1 ===
  if (b1 == LOW && lastBtn1 == HIGH) {
    state1 = !state1;
    servo1.write(state1 ? openAngle : closeAngle);
    Serial.println(state1 ? "Servo 1 OPEN" : "Servo 1 CLOSE");
    delay(200);
  }
  lastBtn1 = b1;

  // === BUTTON 2 ===
  if (b2 == LOW && lastBtn2 == HIGH) {
    state2 = !state2;
    servo2.write(state2 ? openAngle : closeAngle);
    Serial.println(state2 ? "Servo 2 OPEN" : "Servo 2 CLOSE");
    delay(200);
  }
  lastBtn2 = b2;

  // === BUTTON 3 ===
  if (b3 == LOW && lastBtn3 == HIGH) {
    state3 = !state3;
    servo3.write(state3 ? openAngle : closeAngle);
    Serial.println(state3 ? "Servo 3 OPEN" : "Servo 3 CLOSE");
    delay(200);
  }
  lastBtn3 = b3;
}
