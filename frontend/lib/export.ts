import { db } from "./db";

function convertToCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val == null) return "";
    const str = String(val).replace(/"/g, '""');
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
      return `"${str}"`;
    }
    return str;
  };

  const headerLine = headers.map(escape).join(",");
  const rowsLines = rows.map((row) => row.map(escape).join(","));
  return [headerLine, ...rowsLines].join("\n");
}

export async function exportToCSV(farmerId: string): Promise<Blob> {
  const farmer = await db.farmers.where("id").equals(farmerId).first();
  const parcels = await db.parcels.where("farmerId").equals(farmerId).toArray();
  const observations = await db.observations.where("farmerId").equals(farmerId).toArray();
  const inputs = await db.inputs.where("farmerId").equals(farmerId).toArray();
  const alerts = await db.alerts.where("farmerId").equals(farmerId).toArray();
  const recommendations = await db.recommendations.where("farmerId").equals(farmerId).toArray();

  const sections: string[] = [];

  // Sección: Información del Campesino
  sections.push("INFORMACIÓN DEL CAMPESINO");
  sections.push(
    convertToCSV(
      ["Nombre", "ID", "Municipio", "Vereda", "Última Sincronización"],
      [
        [
          farmer?.name || "",
          farmer?.id || "",
          farmer?.municipality || "",
          farmer?.vereda || "",
          farmer?.lastSyncAt
            ? new Date(farmer.lastSyncAt).toLocaleDateString("es-CO")
            : "Nunca",
        ],
      ]
    )
  );

  // Sección: Parcelas
  sections.push("\nPARCELAS");
  sections.push(
    convertToCSV(
      ["Nombre", "Área (m²)", "Tipo de Cultivo", "Activo"],
      parcels.map((p) => [
        p.name || "",
        p.area,
        p.cropType,
        p.isActive ? "Sí" : "No",
      ])
    )
  );

  // Sección: Observaciones
  sections.push("\nOBSERVACIONES DE CULTIVO");
  sections.push(
    convertToCSV(
      ["Fecha", "Estado", "Notas", "Parcela ID"],
      observations.map((o) => [
        new Date(o.createdAt).toLocaleDateString("es-CO"),
        o.status,
        o.notes || "",
        o.parcelId,
      ])
    )
  );

  // Sección: Insumos / Costos
  sections.push("\nINSUMOS Y COSTOS");
  sections.push(
    convertToCSV(
      ["Nombre", "Cantidad", "Unidad", "Costo", "Fecha"],
      inputs.map((i) => [
        i.name,
        i.quantity,
        i.unit,
        i.cost || 0,
        new Date(i.date).toLocaleDateString("es-CO"),
      ])
    )
  );

  const totalCost = inputs.reduce((sum, i) => sum + (i.cost || 0), 0);
  sections.push(`\nTOTAL DE COSTOS,${totalCost}`);

  // Sección: Alertas
  sections.push("\nALERTAS");
  sections.push(
    convertToCSV(
      ["Tipo", "Descripción", "Frecuencia", "Hora", "Activa"],
      alerts.map((a) => [
        a.type,
        a.description || "",
        a.frequency,
        a.hour,
        a.isActive ? "Sí" : "No",
      ])
    )
  );

  // Sección: Recomendaciones
  sections.push("\nRECOMENDACIONES");
  sections.push(
    convertToCSV(
      ["Fecha", "Tipo", "Prioridad", "Estado", "Título", "Descripción", "Acción"],
      recommendations.map((r) => [
        new Date(r.createdAt).toLocaleDateString("es-CO"),
        r.type,
        r.priority,
        r.status,
        r.title,
        r.description,
        r.action || "",
      ])
    )
  );

  const csvContent = sections.join("\n");
  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

export async function exportToJSON(farmerId: string): Promise<Blob> {
  const data = {
    farmer: await db.farmers.where("id").equals(farmerId).first(),
    parcels: await db.parcels.where("farmerId").equals(farmerId).toArray(),
    climate: await db.climateRecords.where("farmerId").equals(farmerId).toArray(),
    observations: await db.observations.where("farmerId").equals(farmerId).toArray(),
    inputs: await db.inputs.where("farmerId").equals(farmerId).toArray(),
    alerts: await db.alerts.where("farmerId").equals(farmerId).toArray(),
    recommendations: await db.recommendations.where("farmerId").equals(farmerId).toArray(),
    exportedAt: new Date().toISOString(),
  };

  return new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
}
