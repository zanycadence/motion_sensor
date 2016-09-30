#include <BLEAttribute.h>
#include <BLECentral.h>
#include <BLECharacteristic.h>
#include <BLECommon.h>
#include <BLEDescriptor.h>
#include <BLEPeripheral.h>
#include <BLEService.h>
#include <BLETypedCharacteristic.h>
#include <BLETypedCharacteristics.h>
#include <BLEUuid.h>
#include <CurieBLE.h>

const int pirPin = 2;

BLEPeripheral blePeripheral;
BLEService pirService("19B10030-E8F2-537E-4F6C-D104768A1214");

BLEIntCharacteristic pirCharacteristic("19B10032-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify);





void setup() {
  Serial.begin(9600);
  pinMode(pirPin, INPUT);

  blePeripheral.setLocalName("Motion");
  blePeripheral.setAdvertisedServiceUuid(pirService.uuid());
  blePeripheral.addAttribute(pirService);
  blePeripheral.addAttribute(pirCharacteristic);

  pirCharacteristic.setValue(0);

  blePeripheral.begin();

}

void loop() {
  blePeripheral.poll();

  int pirValue = digitalRead(pirPin);
  Serial.println(pirValue);
  boolean pirChanged = (pirCharacteristic.value() != pirValue);

  if (pirChanged) {
    pirCharacteristic.setValue(pirValue);
  }
  delay(500);
}
