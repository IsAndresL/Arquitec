import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { db } from "@/lib/db";

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

export async function syncData(farmerId: string): Promise<{ success: boolean; message: string; queued?: boolean }> {
  try {
    // Sincronizar parcelas pendientes usando la cola
    const pendingParcels = await db.parcels
      .where("syncStatus")
      .equals("PENDIENTE")
      .toArray();
    
    if (pendingParcels.length > 0) {
      await api.syncData(
        farmerId,
        "FarmParcel",
        pendingParcels.map((p) => ({
          id: p.id,
          name: p.name,
          area: p.area,
          cropType: p.cropType,
          farmerId: p.farmerId,
        }))
      );
      for (const parcel of pendingParcels) {
        await db.parcels.update(parcel.id, { syncStatus: "SINCRONIZADO" });
      }
    }

    // Sincronizar observaciones pendientes usando la cola
    const pendingObservations = await db.observations
      .where("syncStatus")
      .equals("PENDIENTE")
      .toArray();
    
    if (pendingObservations.length > 0) {
      await api.syncData(
        farmerId,
        "CropObservation",
        pendingObservations.map((o) => ({
          id: o.id,
          status: o.status,
          notes: o.notes,
          farmerId: o.farmerId,
          parcelId: o.parcelId,
        }))
      );
      for (const observation of pendingObservations) {
        await db.observations.update(observation.id, { syncStatus: "SINCRONIZADO" });
      }
    }

    // Sincronizar insumos/costos pendientes usando la cola
    const pendingInputs = await db.inputs
      .where("syncStatus")
      .equals("PENDIENTE")
      .toArray();
    
    if (pendingInputs.length > 0) {
      await api.syncData(
        farmerId,
        "InputRecord",
        pendingInputs.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          unit: i.unit,
          date: i.date,
          cost: i.cost,
          farmerId: i.farmerId,
        }))
      );
      for (const input of pendingInputs) {
        await db.inputs.update(input.id, { syncStatus: "SINCRONIZADO" });
      }
    }

    // Sincronizar alertas pendientes usando la cola
    const pendingAlerts = await db.alerts
      .where("syncStatus")
      .equals("PENDIENTE")
      .toArray();
    
    if (pendingAlerts.length > 0) {
      await api.syncData(
        farmerId,
        "Alert",
        pendingAlerts.map((a) => ({
          id: a.id,
          type: a.type,
          description: a.description,
          frequency: a.frequency,
          hour: a.hour,
          farmerId: a.farmerId,
          parcelId: a.parcelId,
        }))
      );
      for (const alert of pendingAlerts) {
        await db.alerts.update(alert.id, { syncStatus: "SINCRONIZADO" });
      }
    }

    // Obtener datos actualizados del servidor
    await refreshData(farmerId);

    return { success: true, message: "Sincronización encolada exitosamente", queued: true };
  } catch (error) {
    console.error("Sync error:", error);
    return { success: false, message: "Error en la sincronización" };
  }
}

async function refreshData(farmerId: string): Promise<void> {
  try {
    // Obtener parcelas del servidor (respuesta: array directo)
    const serverParcels = await api.getParcels(farmerId);
    const parcelsArr = Array.isArray(serverParcels) ? serverParcels : serverParcels?.data || [];
    if (parcelsArr.length > 0) {
      await db.parcels.bulkPut(parcelsArr);
    }

    // Obtener observaciones del servidor (respuesta: array directo)
    const serverObservations = await api.getObservations(farmerId);
    const obsArr = Array.isArray(serverObservations) ? serverObservations : serverObservations?.data || [];
    if (obsArr.length > 0) {
      await db.observations.bulkPut(obsArr);
    }

    // Obtener insumos del servidor (respuesta: { inputs: [], total: number })
    const serverInputs = await api.getInputs(farmerId);
    const inputsArr = Array.isArray(serverInputs) ? serverInputs
      : Array.isArray(serverInputs?.inputs) ? serverInputs.inputs
      : serverInputs?.data || [];
    if (inputsArr.length > 0) {
      await db.inputs.bulkPut(inputsArr);
    }

    // Obtener alertas del servidor (respuesta: array directo)
    const serverAlerts = await api.getAlerts(farmerId);
    const alertsArr = Array.isArray(serverAlerts) ? serverAlerts : serverAlerts?.data || [];
    if (alertsArr.length > 0) {
      await db.alerts.bulkPut(alertsArr);
    }

    // Obtener recomendaciones del servidor (respuesta: array directo)
    const serverRecommendations = await api.getRecommendations(farmerId);
    const recsArr = Array.isArray(serverRecommendations) ? serverRecommendations : serverRecommendations?.data || [];
    if (recsArr.length > 0) {
      await db.recommendations.bulkPut(recsArr);
    }
  } catch (error) {
    console.error("Error refreshing data:", error);
  }
}
