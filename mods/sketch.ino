// ============================================
//  Golpe repetible para excitar membrana
//  El rele (en Wokwi) representa la etapa de
//  potencia; en hardware real usar MOSFET.
//  El LED encendido = solenoide recibiendo pulso.
// ============================================

const int pinGolpe      = 9;    // D9 -> IN del rele
const int duracionGolpe = 50;   // ms que dura el pulso (ver nota abajo)
const int intervalo     = 1000; // ms entre golpe y golpe

void setup() {
  pinMode(pinGolpe, OUTPUT);
  digitalWrite(pinGolpe, LOW);
}

void loop() {
  digitalWrite(pinGolpe, HIGH);            // golpe: el solenoide empuja
  delay(duracionGolpe);
  digitalWrite(pinGolpe, LOW);             // se retira
  delay(intervalo - duracionGolpe);        // espera hasta el proximo golpe
}
