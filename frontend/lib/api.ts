const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("sf_token") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    let message = error.error || `HTTP ${response.status}`;
    if (error.errors && Array.isArray(error.errors)) {
      message = error.errors.map((e: any) => e.message || e).join(', ');
    } else if (typeof error.error === 'object') {
      message = JSON.stringify(error.error);
    }
    throw new ApiError(response.status, message);
  }

  return response.json();
}

export const api = {
  // Auth
  loginTechnician: (email: string, password: string) =>
    fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  registerTechnician: (data: any) =>
    fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  loginFarmer: (farmerId: string, pin: string) =>
    fetchApi("/auth/login/farmer", {
      method: "POST",
      body: JSON.stringify({ farmerId, pin }),
    }),

  // Farmers
  getFarmers: () => fetchApi("/farmers"),
  getTechnicians: () => fetchApi("/technicians"),
  deleteTechnician: (id: string) =>
    fetchApi(`/technicians/${id}`, { method: "DELETE" }),
  assignFarmerToTechnician: (farmerId: string, technicianId: string) =>
    fetchApi(`/farmers/${farmerId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ technicianId }),
    }),
  getFarmer: (id: string) => fetchApi(`/farmers/${id}`),
  createFarmer: (data: any) =>
    fetchApi("/farmers", { method: "POST", body: JSON.stringify(data) }),
  updateFarmer: (id: string, data: any) =>
    fetchApi(`/farmers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteFarmer: (id: string) =>
    fetchApi(`/farmers/${id}`, { method: "DELETE" }),
  getFarmerDashboard: (id: string) => fetchApi(`/farmers/${id}/dashboard`),
  regeneratePin: (id: string) =>
    fetchApi(`/farmers/${id}/regenerate-pin`, { method: "POST" }),

  // Parcels
  getParcels: (farmerId?: string) =>
    fetchApi(`/parcels${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createParcel: (data: any) =>
    fetchApi("/parcels", { method: "POST", body: JSON.stringify(data) }),
  updateParcel: (id: string, data: any) =>
    fetchApi(`/parcels/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteParcel: (id: string) =>
    fetchApi(`/parcels/${id}`, { method: "DELETE" }),

  // Climate
  getClimateRecords: (farmerId?: string) =>
    fetchApi(`/climate${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createClimateRecord: (data: any) =>
    fetchApi("/climate", { method: "POST", body: JSON.stringify(data) }),
  updateClimateRecord: (id: string, data: any) =>
    fetchApi(`/climate/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteClimateRecord: (id: string) =>
    fetchApi(`/climate/${id}`, { method: "DELETE" }),

  // Observations
  getObservations: (farmerId?: string) =>
    fetchApi(`/observations${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createObservation: (data: any) =>
    fetchApi("/observations", { method: "POST", body: JSON.stringify(data) }),
  updateObservation: (id: string, data: any) =>
    fetchApi(`/observations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteObservation: (id: string) =>
    fetchApi(`/observations/${id}`, { method: "DELETE" }),

  // Inputs (Insumos/Costos)
  getInputs: (farmerId?: string) =>
    fetchApi(`/inputs${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createInput: (data: any) =>
    fetchApi("/inputs", { method: "POST", body: JSON.stringify(data) }),
  updateInput: (id: string, data: any) =>
    fetchApi(`/inputs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteInput: (id: string) =>
    fetchApi(`/inputs/${id}`, { method: "DELETE" }),

  // Alerts
  getAlerts: (farmerId?: string) =>
    fetchApi(`/alerts${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createAlert: (data: any) =>
    fetchApi("/alerts", { method: "POST", body: JSON.stringify(data) }),
  updateAlert: (id: string, data: any) =>
    fetchApi(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteAlert: (id: string) =>
    fetchApi(`/alerts/${id}`, { method: "DELETE" }),

  // Recommendations
  getRecommendations: (farmerId?: string) =>
    fetchApi(`/recommendations${farmerId ? `?farmerId=${farmerId}` : ""}`),
  createRecommendation: (data: any) =>
    fetchApi("/recommendations", { method: "POST", body: JSON.stringify(data) }),
  updateRecommendation: (id: string, data: any) =>
    fetchApi(`/recommendations/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRecommendation: (id: string) =>
    fetchApi(`/recommendations/${id}`, { method: "DELETE" }),
  updateRecommendationStatus: (id: string, status: string) =>
    fetchApi(`/recommendations/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Sync
  syncData: (farmerId: string, entityType: string, data: any[]) =>
    fetchApi("/sync", {
      method: "POST",
      body: JSON.stringify({ farmerId, entityType, data }),
    }),
  getSyncStatus: (farmerId: string) => fetchApi(`/sync/${farmerId}`),

  // Rules
  getRules: () => fetchApi("/rules"),
  createRule: (data: any) =>
    fetchApi("/rules", { method: "POST", body: JSON.stringify(data) }),
  updateRule: (id: string, data: any) =>
    fetchApi(`/rules/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteRule: (id: string) =>
    fetchApi(`/rules/${id}`, { method: "DELETE" }),

  // Dashboard
  getTechnicianDashboard: () => fetchApi("/dashboard/technician"),
  getFarmerDashboardMobile: (farmerId: string) => fetchApi(`/dashboard/farmer?farmerId=${farmerId}`),

  // Activities
  getActivities: () => fetchApi("/activities"),

  // Reports
  getReports: () => fetchApi("/reports"),
  getReport: (id: string) => fetchApi(`/reports/${id}`),
  createReport: (data: any) =>
    fetchApi("/reports", { method: "POST", body: JSON.stringify(data) }),
  updateReport: (id: string, data: any) =>
    fetchApi(`/reports/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteReport: (id: string) =>
    fetchApi(`/reports/${id}`, { method: "DELETE" }),
};

export { ApiError };
