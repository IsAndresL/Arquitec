import Dexie, { Table } from "dexie";
import {
  FarmerProfile,
  FarmParcel,
  ClimateRecord,
  CropObservation,
  InputRecord,
  Alert,
  Recommendation,
  SyncRecord,
  ActivityLog,
} from "@/types";

class SmartFarmingDB extends Dexie {
  farmers!: Table<FarmerProfile>;
  parcels!: Table<FarmParcel>;
  climateRecords!: Table<ClimateRecord>;
  observations!: Table<CropObservation>;
  inputs!: Table<InputRecord>;
  alerts!: Table<Alert>;
  recommendations!: Table<Recommendation>;
  syncRecords!: Table<SyncRecord>;
  activityLogs!: Table<ActivityLog>;

  constructor() {
    super("SmartFarmingDB");
    this.version(2).stores({
      farmers: "id, name, isActive",
      parcels: "id, name, farmerId, cropType, isActive",
      climateRecords: "id, farmerId, date, type, syncStatus",
      observations: "id, farmerId, parcelId, status, syncStatus",
      inputs: "id, farmerId, name, date, syncStatus",
      alerts: "id, farmerId, type, isActive, syncStatus",
      recommendations: "id, farmerId, type, status, syncStatus",
      syncRecords: "id, farmerId, entityType, status",
      activityLogs: "id, farmerId, type, createdAt",
    });
  }
}

export const db = new SmartFarmingDB();

export async function initDatabase(): Promise<void> {
  await db.open();
  console.log("Database initialized");
}

export async function addToSyncQueue(
  entityType: string,
  entityId: string,
  data: any
): Promise<void> {
  await db.syncRecords.add({
    id: crypto.randomUUID(),
    entityType,
    entityId,
    status: "PENDIENTE",
    conflictData: data,
    createdAt: new Date(),
    updatedAt: new Date(),
    farmerId: data.farmerId || "",
  });
}

export async function addActivityLog(
  type: string,
  description: string,
  entityType: string,
  entityId: string,
  farmerId?: string
): Promise<void> {
  await db.activityLogs.add({
    id: crypto.randomUUID(),
    type,
    description,
    entityType,
    entityId,
    farmerId: farmerId || null,
    createdAt: new Date(),
  });
}
