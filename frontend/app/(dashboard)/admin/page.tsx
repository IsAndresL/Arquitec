"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { FarmerProfile, FarmParcel } from "@/types";
import { 
  Users,
  User,
  Home as HomeIcon,
  Bell,
  RefreshCw,
  Send,
  BarChart,
  FileText,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ 
    farmers: 0, 
    parcels: 0, 
    alerts: 0, 
    reports: 0 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sync and Alert States
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [parcels, setParcels] = useState<FarmParcel[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [selectedParcelId, setSelectedParcelId] = useState("");
  const [alertType, setAlertType] = useState<'REVISAR_CULTIVO' | 'RIEGO' | 'OTRO'>('RIEGO');
  const [alertDescription, setAlertDescription] = useState("");
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false);
  const [alertError, setAlertError] = useState("");
  const [alertSuccess, setAlertSuccess] = useState("");

  useEffect(() => {
    async function loadStatsAndActivities() {
      setIsLoading(true);
      try {
        const [dashboardData, logs, farmersList] = await Promise.all([
          api.getTechnicianDashboard(),
          api.getActivities().catch(() => []),
          api.getFarmers().catch(() => [])
        ]);
        
        setStats({
          farmers: dashboardData.metrics?.totalFarmers || 0,
          parcels: dashboardData.metrics?.totalParcels || 0,
          alerts: dashboardData.metrics?.activeAlerts || 0,
          reports: dashboardData.metrics?.totalReports || 0,
        });

        setActivities(logs);
        setFarmers(Array.isArray(farmersList) ? farmersList : []);
      } catch (err) {
        console.error("Error cargando dashboard:", err);
      }
      setIsLoading(false);
    }
    loadStatsAndActivities();

    // Load last sync time
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sf_last_sync");
      if (saved) {
        setLastSyncTime(saved);
      } else {
        const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
        localStorage.setItem("sf_last_sync", now);
        setLastSyncTime(now);
      }
    }
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const [dashboardData, logs, farmersList] = await Promise.all([
        api.getTechnicianDashboard(),
        api.getActivities().catch(() => []),
        api.getFarmers().catch(() => [])
      ]);
      
      setStats({
        farmers: dashboardData.metrics?.totalFarmers || 0,
        parcels: dashboardData.metrics?.totalParcels || 0,
        alerts: dashboardData.metrics?.activeAlerts || 0,
        reports: dashboardData.metrics?.totalReports || 0,
      });

      setActivities(logs);
      setFarmers(Array.isArray(farmersList) ? farmersList : []);

      const now = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      localStorage.setItem("sf_last_sync", now);
      setLastSyncTime(now);
    } catch (err) {
      console.error("Error al sincronizar:", err);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 800);
    }
  };

  const handleFarmerChange = async (farmerId: string) => {
    setSelectedFarmerId(farmerId);
    setSelectedParcelId("");
    if (!farmerId) {
      setParcels([]);
      return;
    }
    try {
      const parcelsRes = await api.getParcels(farmerId);
      const parsedParcels = Array.isArray(parcelsRes) ? parcelsRes : (parcelsRes?.data || []);
      setParcels(parsedParcels);
    } catch (err) {
      console.error("Error al cargar parcelas:", err);
      setParcels([]);
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId) {
      setAlertError("Por favor selecciona un campesino.");
      return;
    }
    setIsSubmittingAlert(true);
    setAlertError("");
    setAlertSuccess("");

    try {
      await api.createAlert({
        type: alertType,
        description: alertDescription || undefined,
        frequency: "DIARIA",
        hour: "08:00",
        farmerId: selectedFarmerId,
        parcelId: selectedParcelId || undefined
      });

      setAlertSuccess("¡Alerta enviada con éxito!");
      setAlertDescription("");
      setSelectedFarmerId("");
      setSelectedParcelId("");
      setParcels([]);

      // Reload dashboard stats and activities
      const [dashboardData, logs] = await Promise.all([
        api.getTechnicianDashboard(),
        api.getActivities().catch(() => [])
      ]);

      setStats({
        farmers: dashboardData.metrics?.totalFarmers || 0,
        parcels: dashboardData.metrics?.totalParcels || 0,
        alerts: dashboardData.metrics?.activeAlerts || 0,
        reports: dashboardData.metrics?.totalReports || 0,
      });
      setActivities(logs);

      // Close modal after delay
      setTimeout(() => {
        setIsAlertModalOpen(false);
        setAlertSuccess("");
      }, 1500);

    } catch (err: any) {
      console.error("Error al enviar alerta:", err);
      setAlertError(err.message || "No se pudo enviar la alerta. Inténtalo de nuevo.");
    } finally {
      setIsSubmittingAlert(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.blue.primary }}></div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.gray.pale }}>
      {/* Header azul oficial de Figma */}
      <div className="p-4" style={{ backgroundColor: COLORS.blue.primary }}>
        <div className="flex items-center justify-between mb-4">
          <Link href="/settings" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm">
              <User size={24} color={COLORS.blue.primary} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-xs" style={{ color: COLORS.blue.pale, fontFamily: 'DM Sans, sans-serif', fontWeight: 500 }}>Panel técnico</p>
              <p style={{ color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px' }}>
                {user?.data?.name || "Técnico"}
              </p>
              {lastSyncTime && (
                <p className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: COLORS.blue.pale, fontFamily: 'DM Sans, sans-serif' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"></span>
                  Sincronizado: {lastSyncTime}
                </p>
              )}
            </div>
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className={`p-2 rounded-full hover:scale-105 active:scale-95 transition-transform flex items-center justify-center`} 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            >
              <RefreshCw size={20} color={COLORS.white} strokeWidth={2.5} className={isSyncing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setIsNotificationsOpen(true)} className="p-2 rounded-full relative hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <Bell size={20} color={COLORS.white} strokeWidth={2.5} />
              {activities.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-[8px] font-bold text-white rounded-full border border-blue-700 flex items-center justify-center animate-pulse">
                  {activities.length > 9 ? '9+' : activities.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Stats Mini Cards (4 columnas) */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Users, label: 'Campesinos', value: stats.farmers.toString() },
            { icon: HomeIcon, label: 'Parcelas', value: stats.parcels.toString() },
            { icon: Bell, label: 'Alertas hoy', value: stats.alerts.toString() },
            { icon: FileText, label: 'Reportes', value: stats.reports.toString() }
          ].map((stat, idx) => (
            <div key={idx} className="text-center p-3 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
              <stat.icon size={20} color={COLORS.white} strokeWidth={2.5} className="mx-auto mb-1" />
              <p className="text-2xl mb-1" style={{ color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>{stat.value}</p>
              <p className="text-[10px]" style={{ color: COLORS.blue.pale, fontFamily: 'DM Sans, sans-serif' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contenido principal con las tarjetas grandes de Figma */}
      <div className="p-4 flex flex-col items-center">
        <div className="grid grid-cols-2 gap-4 max-w-md w-full">
          {/* Tarjeta Campesinos */}
          <Link href="/admin/farmers" className="relative p-6 rounded-2xl transition-all hover:scale-[1.02]" style={{ backgroundColor: COLORS.blue.pale, border: `2px solid ${COLORS.blue.light}` }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ backgroundColor: COLORS.white }}>
              <Users size={28} color={COLORS.blue.primary} strokeWidth={2.5} />
            </div>
            <p className="mb-1 text-center" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px' }}>Campesinos</p>
            <p className="text-sm text-center" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>Gestionar perfiles</p>
          </Link>

          {/* Tarjeta Recomendaciones */}
          <Link href="/admin/recommendations" className="relative p-6 rounded-2xl transition-all hover:scale-[1.02]" style={{ backgroundColor: COLORS.green.pale, border: `2px solid ${COLORS.green.light}` }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ backgroundColor: COLORS.white }}>
              <Send size={28} color={COLORS.green.primary} strokeWidth={2.5} />
            </div>
            <p className="mb-1 text-center" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px' }}>Consejos</p>
            <p className="text-sm text-center" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>Enviar al productor</p>
          </Link>

          {/* Tarjeta Reportes */}
          <Link href="/admin/reports" className="relative p-6 rounded-2xl transition-all hover:scale-[1.02]" style={{ backgroundColor: COLORS.amber.pale, border: `2px solid ${COLORS.amber.light}` }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ backgroundColor: COLORS.white }}>
              <BarChart size={28} color={COLORS.amber.primary} strokeWidth={2.5} />
            </div>
            <p className="mb-1 text-center" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px' }}>Generar Reporte</p>
            <p className="text-sm text-center" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>Exportar datos</p>
          </Link>

          {/* Tarjeta Enviar Alertas (Reemplaza a Sincronización) */}
          <button 
            onClick={() => setIsAlertModalOpen(true)} 
            className="relative p-6 rounded-2xl transition-all hover:scale-[1.02] flex flex-col items-center justify-center w-full" 
            style={{ backgroundColor: COLORS.green.pale, border: `2px solid ${COLORS.green.light}` }}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-3 mx-auto" style={{ backgroundColor: COLORS.white }}>
              <Bell size={28} color={COLORS.green.primary} strokeWidth={2.5} />
            </div>
            <p className="mb-1 text-center" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '16px' }}>Enviar Alertas</p>
            <p className="text-sm text-center" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>Notificar productor</p>
          </button>

          {/* Tarjeta de Gestión de Técnicos (Solo para Técnico Principal) */}
          {user?.type === 'technician' && user.data.email === 'tecnico@magdalena-smart-farming.com' && (
            <Link 
              href="/admin/technicians" 
              className="col-span-2 relative p-5 rounded-2xl transition-all hover:scale-[1.01] flex items-center gap-4 bg-purple-50 hover:bg-purple-100/50 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer" 
              style={{ border: `2px solid rgba(168, 85, 247, 0.2)` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm">
                <User size={24} className="text-purple-600" strokeWidth={2.5} />
              </div>
              <div className="text-left">
                <p className="mb-0.5" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '15px' }}>Gestionar Técnicos</p>
                <p className="text-xs text-gray-500" style={{ fontFamily: 'DM Sans, sans-serif' }}>Administrar y desactivar cuentas de técnicos</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Cajón de Notificaciones Deslizable */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header del Cajón */}
            <div className="p-4 flex items-center justify-between border-b" style={{ backgroundColor: COLORS.blue.primary }}>
              <div className="flex items-center gap-2">
                <Bell size={22} color={COLORS.white} />
                <h3 className="text-lg font-bold text-white">Notificaciones</h3>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)} 
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={22} color={COLORS.white} />
              </button>
            </div>

            {/* Lista de Actividades */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col gap-1 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                        {act.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(act.createdAt).toLocaleDateString('es-CO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 leading-relaxed mt-1">
                      {act.description}
                    </p>
                    {act.farmer && (
                      <span className="text-[11px] text-gray-400 mt-1 font-medium">
                        Productor: <strong className="text-gray-600">{act.farmer.name}</strong>
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-gray-400">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <Bell size={32} className="text-blue-500 opacity-60" />
                  </div>
                  <p className="font-bold text-gray-700 text-lg mb-1">Sin notificaciones nuevas</p>
                  <p className="text-sm px-8">Las actividades de tus agricultores asignados se mostrarán aquí en tiempo real.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Enviar Alertas (Premium HSL Design) */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-5 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: COLORS.blue.primary }}>
              <div className="flex items-center gap-2">
                <Bell size={22} className="text-white" />
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Crear Nueva Alerta</h3>
              </div>
              <button 
                onClick={() => setIsAlertModalOpen(false)} 
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSendAlert} className="p-6 flex-1 overflow-y-auto space-y-4">
              {alertError && (
                <div className="p-3.5 rounded-xl text-sm font-medium border text-red-700 bg-red-50 border-red-100 flex items-start gap-2">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <span>{alertError}</span>
                </div>
              )}

              {alertSuccess && (
                <div className="p-3.5 rounded-xl text-sm font-medium border text-green-700 bg-green-50 border-green-100 flex items-start gap-2 animate-bounce">
                  <span className="shrink-0 mt-0.5">✨</span>
                  <span>{alertSuccess}</span>
                </div>
              )}

              {/* Selector Campesino */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Campesino</label>
                <select
                  required
                  value={selectedFarmerId}
                  onChange={(e) => handleFarmerChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                >
                  <option value="">Selecciona un campesino...</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector Parcela */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Parcela (Opcional)</label>
                <select
                  value={selectedParcelId}
                  disabled={!selectedFarmerId}
                  onChange={(e) => setSelectedParcelId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Todas las parcelas o Ninguna...</option>
                  {parcels.map((parcel) => (
                    <option key={parcel.id} value={parcel.id}>
                      {parcel.name} ({parcel.cropType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Severidad / Tipo Alerta */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Severidad de la Alerta</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: 'REVISAR_CULTIVO', label: 'Urgente', color: COLORS.red.primary, bg: 'bg-red-50', border: 'border-red-200' },
                    { type: 'RIEGO', label: 'Riego', color: COLORS.amber.primary, bg: 'bg-amber-50', border: 'border-amber-200' },
                    { type: 'OTRO', label: 'Otro', color: COLORS.blue.primary, bg: 'bg-blue-50', border: 'border-blue-200' }
                  ].map((btn) => {
                    const isSelected = alertType === btn.type;
                    return (
                      <button
                        key={btn.type}
                        type="button"
                        onClick={() => setAlertType(btn.type as any)}
                        className={`py-3.5 rounded-xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected 
                            ? `border-2 scale-[1.03] shadow-sm` 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                        style={{
                          borderColor: isSelected ? btn.color : undefined,
                          backgroundColor: isSelected ? undefined : undefined,
                          color: btn.color
                        }}
                      >
                        <AlertTriangle size={16} style={{ color: btn.color }} />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descripción / Instrucción */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Instrucción / Descripción</label>
                <textarea
                  required
                  rows={3}
                  value={alertDescription}
                  onChange={(e) => setAlertDescription(e.target.value)}
                  placeholder="Instrucción detallada para el agricultor..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Botón de Enviar */}
              <button
                type="submit"
                disabled={isSubmittingAlert}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: COLORS.blue.primary }}
              >
                {isSubmittingAlert ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Enviando Alerta...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Enviar Alerta</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
