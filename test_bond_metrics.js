// Test simple para verificar las métricas corregidas
// Este archivo es temporal para pruebas

// Datos de ejemplo del PDF - Bono americano
const testBond = {
  id: "test",
  name: "Test Bond",
  nominalValue: 100000,     // S/ 100,000
  interestRate: 7.5,        // 7.5% anual
  term: 5,                  // 5 años
  frequency: 2,             // Semestral
  amortizationType: "American",
  graceType: "None",
  gracePeriods: 0,
  emissionDate: "2024-01-01",
  settings: {
    currency: "PEN",
    interestRateType: "Effective"
  },
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z", 
  userId: "test"
};

console.log("=== PRUEBA DE MÉTRICAS FINANCIERAS ===");
console.log("Datos del bono:");
console.log("- Valor Nominal: S/ 100,000");
console.log("- Tasa: 7.5% efectiva anual");
console.log("- Plazo: 5 años");
console.log("- Frecuencia: Semestral");
console.log("- Tipo: Americano");
console.log();

console.log("Resultados esperados:");
console.log("- Si precio = valor nominal, entonces TCEA = TREA = 7.5%");
console.log("- Para método americano: solo pagos de interés + capital al final");
console.log();

// Flujos esperados para bono americano:
// Periodos 1-9: S/ 3,685.40 (solo interés)
// Periodo 10: S/ 103,685.40 (interés + capital)
const expectedInterest = 100000 * (Math.pow(1.075, 1/2) - 1); // Tasa semestral efectiva
console.log("Tasa semestral efectiva:", ((Math.pow(1.075, 1/2) - 1) * 100).toFixed(4) + "%");
console.log("Interés semestral esperado: S/", expectedInterest.toFixed(2));
