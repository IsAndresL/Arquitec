export interface AgronomicRule {
  id: string;
  condition: {
    parameter: string;
    operator: "<" | ">" | "<=" | ">=" | "==";
    value: number;
  };
  recommendation: string;
  priority: "high" | "medium" | "low";
}

export const agronomicRules: AgronomicRule[] = [
  {
    id: "ph_low",
    condition: { parameter: "ph", operator: "<", value: 6.0 },
    recommendation: "El pH del suelo está bajo. Considere aplicar cal agrícola para aumentar el pH.",
    priority: "high",
  },
  {
    id: "ph_high",
    condition: { parameter: "ph", operator: ">", value: 7.5 },
    recommendation: "El pH del suelo está alto. Considere aplicar azufre o materia orgánica para reducir el pH.",
    priority: "high",
  },
  {
    id: "nitrogen_low",
    condition: { parameter: "nitrogen", operator: "<", value: 20 },
    recommendation: "Niveles bajos de nitrógeno. Aplique fertilizante nitrogenado.",
    priority: "high",
  },
  {
    id: "moisture_low",
    condition: { parameter: "moisture", operator: "<", value: 30 },
    recommendation: "Humedad del suelo baja. Programe riego lo antes posible.",
    priority: "high",
  },
  {
    id: "temperature_high",
    condition: { parameter: "temperature", operator: ">", value: 35 },
    recommendation: "Temperatura alta. Asegure suficiente riego y considere sombra para cultivos sensibles.",
    priority: "medium",
  },
  {
    id: "humidity_high",
    condition: { parameter: "humidity", operator: ">", value: 80 },
    recommendation: "Humedad ambiental alta. Monitoree enfermedades fúngicas y asegure buena ventilación.",
    priority: "medium",
  },
];

export function evaluateRules(data: Record<string, number>): AgronomicRule[] {
  return agronomicRules.filter((rule) => {
    const value = data[rule.condition.parameter];
    if (value === undefined) return false;

    switch (rule.condition.operator) {
      case "<":
        return value < rule.condition.value;
      case ">":
        return value > rule.condition.value;
      case "<=":
        return value <= rule.condition.value;
      case ">=":
        return value >= rule.condition.value;
      case "==":
        return value === rule.condition.value;
      default:
        return false;
    }
  });
}
