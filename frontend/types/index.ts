export interface FarmerProfile {
  id: string;
  name: string;
  photoUrl?: string | null;
  municipality?: string | null;
  vereda?: string | null;
  pinHash: string;
  isActive: boolean;
  isLocked: boolean;
  lockedUntil?: Date | null;
  failedAttempts: number;
  lastSyncAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface FarmParcel {
  id: string;
  name?: string | null;
  area: number;
  cropType: string;
  icon?: string | null;
  isActive: boolean;
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
}

export interface ClimateRecord {
  id: string;
  date: Date;
  type: "SOL" | "NUBLADO" | "LLUVIA" | "VIENTO";
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
}

export interface CropObservation {
  id: string;
  status: "SANO" | "HOJAS_AMARILLAS" | "MANCHAS_NEGRAS" | "HOJAS_SECAS" | "OTRA";
  notes?: string | null;
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
  parcelId: string;
}

export interface InputRecord {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  date: Date;
  cost?: number | null;
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
}

export interface Alert {
  id: string;
  type: "RIEGO" | "REVISAR_CULTIVO" | "OTRO";
  description?: string | null;
  frequency: "DIARIA" | "CADA_N_DIAS" | "SEMANAL";
  intervalDays?: number | null;
  hour: string;
  isActive: boolean;
  parcelId?: string | null;
  nextTrigger?: Date | null;
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
}

export interface Recommendation {
  id: string;
  type: "AUTOMATICA" | "MANUAL";
  priority: "BAJA" | "MEDIA" | "ALTA";
  status: "PENDIENTE" | "VISTA" | "SEGUIDA" | "IGNORADA";
  title: string;
  description: string;
  action?: string | null;
  cropStatus?: string | null;
  climateType?: string | null;
  cropType?: string | null;
  followedAt?: Date | null;
  ignoredAt?: Date | null;
  syncStatus: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
  observationId?: string | null;
  technicianId?: string | null;
}

export interface ActivityLog {
  id?: string;
  type: string;
  description: string;
  entityType: string;
  entityId: string;
  metadata?: any;
  createdAt: Date;
  farmerId?: string | null;
  parcelId?: string | null;
  userId?: string | null;
}

export interface SyncRecord {
  id?: string;
  entityType: string;
  entityId: string;
  status: "PENDIENTE" | "SINCRONIZADO" | "CONFLICTO";
  conflictData?: any;
  syncedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  farmerId: string;
}

export interface AgronomicRule {
  id: string;
  cropType: string;
  cropStatus: "SANO" | "HOJAS_AMARILLAS" | "MANCHAS_NEGRAS" | "HOJAS_SECAS" | "OTRA";
  climateType?: "SOL" | "NUBLADO" | "LLUVIA" | "VIENTO" | null;
  action: string;
  priority: "BAJA" | "MEDIA" | "ALTA";
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "TECNICO_ADMIN" | "CAMPESINO";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para el frontend (simplificados para UI)
export interface Parcel {
  id: string;
  name: string;
  area: number;
  cropType: string;
  farmerId: string;
}

export interface Crop {
  id: string;
  name: string;
  variety: string;
  parcelId: string;
  plantingDate: Date;
  status: string;
}

export interface AgronomicData {
  id: string;
  cropId: string;
  date: Date;
  ph: number;
  moisture: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
}

export interface Cost {
  id: string;
  cropId: string;
  category: string;
  description: string;
  amount: number;
  date: Date;
}
