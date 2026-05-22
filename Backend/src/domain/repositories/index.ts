export interface IUserRepository {
  findById(id: string): Promise<any | null>
  findByEmail(email: string): Promise<any | null>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  updateFailedLogins(id: string, failedLogins: number, lockedUntil?: Date | null): Promise<void>
  findAll(): Promise<any[]>
}

export interface IFarmerRepository {
  findById(id: string): Promise<any | null>
  findByPinHash(pinHash: string): Promise<any | null>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  updateFailedAttempts(id: string, attempts: number, lockedUntil?: Date | null): Promise<void>
  findAll(filters?: any): Promise<any[]>
  findByTechnician(technicianId: string): Promise<any[]>
  regeneratePIN(id: string, pinHash: string): Promise<any>
}

export interface IParcelRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
}

export interface IClimateRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
}

export interface IObservationRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  findByParcel(parcelId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
}

export interface IInputRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
  calculateTotal(farmerId: string): Promise<number>
}

export interface IAlertRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
}

export interface IRecommendationRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  findByTechnician(technicianId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  updateStatus(id: string, status: string, followedAt?: Date, ignoredAt?: Date): Promise<any>
}

export interface IActivityRepository {
  findById(id: string): Promise<any | null>
  findAll(filters?: any): Promise<any[]>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
}

export interface IRuleRepository {
  findById(id: string): Promise<any | null>
  findAll(): Promise<any[]>
  findActive(): Promise<any[]>
  findByCriteria(cropType: string, cropStatus: string, climateType?: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
  delete(id: string): Promise<void>
}

export interface ISyncRepository {
  findById(id: string): Promise<any | null>
  findByFarmer(farmerId: string): Promise<any[]>
  create(data: any): Promise<any>
  updateStatus(id: string, status: string, syncedAt?: Date): Promise<any>
  getSyncPercentage(farmerId: string): Promise<number>
}

export interface IReportRepository {
  findById(id: string): Promise<any | null>
  findByTechnician(technicianId: string): Promise<any[]>
  create(data: any): Promise<any>
  update(id: string, data: any): Promise<any>
}
