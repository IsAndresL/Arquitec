"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, addToSyncQueue, addActivityLog } from "@/lib/db";
import { api } from "@/lib/api";
import { FarmParcel, Alert, InputRecord, Recommendation, CropObservation, FarmerProfile } from "@/types";
import { syncData } from "@/hooks/useSync";
import { notifications } from "@/lib/notifications";
import { 
  Bell, 
  Settings, 
  Home as HomeIcon, 
  ClipboardList, 
  Sprout,
  DollarSign,
  User,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  Sun,
  Check,
  X,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function DashboardPage() {
  const { user, isOnline } = useAuth();
  const isFarmer = user?.type === "farmer";
  const farmer = isFarmer ? (user?.data as FarmerProfile) : null;
  const farmerId = farmer?.id;
  
  const [stats, setStats] = useState({
    parcels: 0,
    observations: 0,
    alerts: 0,
    costs: 0,
    recommendations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [isUpdatingAlert, setIsUpdatingAlert] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Solicitar permiso de notificación HTML5 al ingresar
  useEffect(() => {
    if (typeof window !== "undefined") {
      notifications.requestPermission().catch(console.error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      let parcels: FarmParcel[] = [];
      let alerts: Alert[] = [];
      let inputs: InputRecord[] = [];
      let recommendations: Recommendation[] = [];
      let observations: CropObservation[] = [];

      try {
        const results = await Promise.allSettled([
          api.getParcels(farmerId),
          api.getAlerts(farmerId),
          api.getInputs(farmerId),
          api.getRecommendations(farmerId),
          api.getObservations(farmerId),
        ]);

        if (results[0].status === 'fulfilled') {
          const res = results[0].value;
          parcels = Array.isArray(res) ? res : (res?.data || []);
        }
        
        if (results[1].status === 'fulfilled') {
          const res = results[1].value;
          alerts = Array.isArray(res) ? res : (res?.data || []);
        }
        
        if (results[2].status === 'fulfilled') {
          const res = results[2].value;
          inputs = Array.isArray(res) ? res : (res?.inputs || res?.data || []);
        }
        
        if (results[3].status === 'fulfilled') {
          const res = results[3].value;
          recommendations = Array.isArray(res) ? res : (res?.data || []);
        }
        
        if (results[4].status === 'fulfilled') {
          const res = results[4].value;
          observations = Array.isArray(res) ? res : (res?.data || []);
        }
      } catch (error) {
        console.error('[Dashboard] Error cargando desde API:', error);
      }

      // Fallback a IndexedDB
      if (parcels.length === 0) parcels = await db.parcels.where("farmerId").equals(farmerId).toArray();
      if (alerts.length === 0) alerts = await db.alerts.where("farmerId").equals(farmerId).toArray();
      if (inputs.length === 0) inputs = await db.inputs.where("farmerId").equals(farmerId).toArray();
      if (recommendations.length === 0) recommendations = await db.recommendations.where("farmerId").equals(farmerId).toArray();
      if (observations.length === 0) observations = await db.observations.where("farmerId").equals(farmerId).toArray();

      const activeAlertList = alerts.filter((a) => a.isActive);
      const totalCosts = inputs.reduce((sum, input) => sum + (input.cost || 0), 0);
      const pendingRecommendations = recommendations.filter((r) => r.status === "PENDIENTE");

      // Fire notifications if new technical advice or critical alert arrived (after initial load)
      const prevAlerts = activeAlerts.length;
      if (activeAlertList.length > prevAlerts && prevAlerts > 0) {
        notifications.show(
          "Accion Urgente Requerida",
          activeAlertList[0].description || "Tu asesor tecnico ha enviado una nueva alerta critica de cultivo."
        );
      }

      const prevRecs = stats.recommendations;
      if (pendingRecommendations.length > prevRecs && prevRecs > 0) {
        notifications.show(
          "Nuevo Consejo Agricola",
          pendingRecommendations[0].title || "Tienes una nueva recomendacion tecnica por revisar."
        );
      }

      setStats({
        parcels: parcels.length,
        observations: observations.length,
        alerts: activeAlertList.length,
        costs: totalCosts,
        recommendations: pendingRecommendations.length,
      });

      // Sort alerts descending by createdAt to get the absolute latest alert
      const sortedActiveAlerts = [...activeAlertList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setActiveAlerts(sortedActiveAlerts);

      // Calcular cantidad de cambios pendientes locales
      const [pParcels, pObs, pInputs, pClimate, pAlerts] = await Promise.all([
        db.parcels.where("syncStatus").equals("PENDIENTE").count(),
        db.observations.where("syncStatus").equals("PENDIENTE").count(),
        db.inputs.where("syncStatus").equals("PENDIENTE").count(),
        db.climateRecords.where("syncStatus").equals("PENDIENTE").count(),
        db.alerts.where("syncStatus").equals("PENDIENTE").count(),
      ]);
      setPendingSyncCount(pParcels + pObs + pInputs + pClimate + pAlerts);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
    setIsLoading(false);
  }, [farmerId, activeAlerts.length, stats.recommendations]);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const handleSync = useCallback(async () => {
    if (!farmerId) return;
    setIsSyncing(true);
    setSyncMessage("Sincronizando...");
    try {
      const res = await syncData(farmerId);
      if (res.success) {
        setSyncMessage("¡Sincronizado!");
        notifications.show(
          "Sincronizacion Exitosa",
          "Tus parcelas, insumos y clima se han sincronizado con el asesor tecnico de manera correcta."
        );
        setTimeout(() => setSyncMessage(""), 3000);
        await loadData();
      } else {
        setSyncMessage("Error de sincronización");
        setTimeout(() => setSyncMessage(""), 3000);
      }
    } catch (err) {
      console.error("Sync error:", err);
      setSyncMessage("Error de conexión");
      setTimeout(() => setSyncMessage(""), 3000);
    } finally {
      setIsSyncing(false);
    }
  }, [farmerId, loadData]);

  // Sincronización automática al detectar conexión a Internet
  useEffect(() => {
    if (isOnline && farmerId) {
      syncData(farmerId)
        .then((res) => {
          if (res.success) {
            notifications.show(
              "Sincronizacion Automatica",
              "Se detecto conexion a internet. Los datos locales pendientes han sido sincronizados automaticamente con el tecnico."
            );
            loadData();
          }
        })
        .catch(console.error);
    }
  }, [isOnline, farmerId, loadData]);


  const handleToggleAlertDone = async (alertId: string, markDone: boolean) => {
    if (!markDone) {
      setSelectedAlertForAction(null);
      return;
    }

    setIsUpdatingAlert(true);
    try {
      // 1. Call API to update alert isActive: false
      try {
        await api.updateAlert(alertId, { isActive: false });
      } catch (apiErr) {
        console.warn("[Dashboard] Falló actualización en API, se actualizará localmente:", apiErr);
      }

      // 2. Update locally in Dexie IndexedDB
      await db.alerts.update(alertId, { isActive: false, syncStatus: "PENDIENTE" });

      // 3. Queue offline sync
      await addToSyncQueue("alerts", alertId, { id: alertId, isActive: false, farmerId });

      // 4. Log activity
      await addActivityLog(
        "ALERTA_RESOLVIDA",
        `Alerta marcada como completada`,
        "alerts",
        alertId,
        farmerId || ""
      );

      setSelectedAlertForAction(null);
      await loadData();
    } catch (err) {
      console.error("Error al actualizar la alerta:", err);
    } finally {
      setIsUpdatingAlert(false);
    }
  };

  useEffect(() => {
    if (farmerId) {
      loadData();
    }
  }, [farmerId, loadData]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.green.primary }}></div>
      </div>
    );
  }

  const totalNotifications = stats.alerts;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white">
      {/* Sleek, super compact header */}
      <div className="py-4.5 px-6 flex-shrink-0" style={{ backgroundColor: COLORS.green.primary }}>
        <div className="flex items-center justify-between">
          <Link href="/settings" className="flex items-center gap-4 hover:opacity-90 active:scale-95 transition-all">
            <div className="w-13 h-13 rounded-full flex items-center justify-center bg-white shadow-sm flex-shrink-0">
              <User size={26} color={COLORS.green.primary} strokeWidth={3} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-extrabold leading-none mb-1.5" style={{ color: COLORS.green.pale }}>Bienvenido</p>
              <p className="text-xl font-black leading-none" style={{ color: COLORS.white }}>{farmer?.name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            {syncMessage && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-3 py-1.5 rounded-full animate-pulse mr-1">
                {syncMessage}
              </span>
            )}
            {!isOnline && (
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white animate-pulse mr-1">
                Offline
              </span>
            )}
            <button 
              onClick={handleSync} 
              disabled={isSyncing}
              className="p-3 rounded-xl transition-transform active:scale-90 flex items-center justify-center cursor-pointer" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
              title="Sincronizar datos"
            >
              <RefreshCw size={24} color={COLORS.white} strokeWidth={3} className={isSyncing ? "animate-spin" : ""} />
            </button>
            <Link href="/alerts" className="relative p-3 rounded-xl transition-transform active:scale-90" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
              <Bell size={24} color={COLORS.white} strokeWidth={3} />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center border-2 border-green-700 animate-bounce">
                  {totalNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Main compact body with soft background and grouped elements */}
      <div className="p-6 flex-1 flex flex-col gap-6 overflow-y-auto min-h-0" style={{ backgroundColor: COLORS.gray.pale }}>
        {/* Barra de Estado de Sincronización y Conexión */}
        <div className="w-full p-4 rounded-[28px] bg-white border border-gray-100/60 flex items-center justify-between shadow-[0_4px_16px_rgba(0,0,0,0.02)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'}`}>
              <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Última Sincronización</span>
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
              </div>
              <p className="text-xs font-bold text-gray-700 mt-1">
                {farmer?.lastSyncAt 
                  ? new Date(farmer.lastSyncAt).toLocaleString('es-CO', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
                  : 'Sin sincronización reciente'
                }
              </p>
            </div>
          </div>
          
          {pendingSyncCount > 0 ? (
            <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/50 flex items-center gap-1.5 animate-pulse shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">
                {pendingSyncCount} pendientes
              </span>
            </div>
          ) : (
            <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/50 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider">
                Al día
              </span>
            </div>
          )}
        </div>

        {/* Alerts section */}
        {activeAlerts.length > 0 ? (
          <div className="space-y-4 w-full flex-shrink-0">
            {/* Primary / Newest Alert Banner */}
            {activeAlerts[0].type === 'REVISAR_CULTIVO' ? (
              <button 
                onClick={() => setSelectedAlertForAction(activeAlerts[0])}
                className="w-full text-left p-5.5 rounded-[32px] flex items-center justify-between animate-pulse transition-all hover:scale-[1.01] active:scale-95 duration-200 transform cursor-pointer border-2 bg-white" 
                style={{ 
                  backgroundColor: COLORS.red.pale, 
                  borderColor: COLORS.red.primary,
                  boxShadow: '0 8px 20px rgba(214, 40, 40, 0.08)' 
                }}
              >
                <div className="flex items-center gap-4.5 min-w-0">
                  <div className="w-15 h-15 rounded-3xl flex items-center justify-center bg-white shadow-sm flex-shrink-0 border" style={{ borderColor: COLORS.red.light }}>
                    <AlertTriangle size={30} color={COLORS.red.primary} strokeWidth={3} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 leading-none mb-2">
                      <p style={{ color: COLORS.red.primary, fontWeight: 900, fontSize: '18px' }}>¡Acción urgente!</p>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-1 rounded-full">Nueva</span>
                    </div>
                    <p className="text-sm font-extrabold truncate" style={{ color: COLORS.red.primary, opacity: 0.95 }}>
                      {activeAlerts[0].description || 'Revisar el cultivo de inmediato'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={26} color={COLORS.red.primary} className="flex-shrink-0 ml-1" />
              </button>
            ) : (
              <button 
                onClick={() => setSelectedAlertForAction(activeAlerts[0])}
                className="w-full text-left p-5.5 rounded-[32px] flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 duration-200 transform cursor-pointer border-2 bg-white" 
                style={{ 
                  backgroundColor: COLORS.amber.pale, 
                  borderColor: COLORS.amber.primary,
                  boxShadow: '0 8px 20px rgba(233, 166, 42, 0.08)'
                }}
              >
                <div className="flex items-center gap-4.5 min-w-0">
                  <div className="w-15 h-15 rounded-3xl flex items-center justify-center bg-white shadow-sm flex-shrink-0 border" style={{ borderColor: COLORS.amber.light }}>
                    <AlertTriangle size={30} color={COLORS.amber.primary} strokeWidth={3} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 leading-none mb-2">
                      <p style={{ color: COLORS.amber.primary, fontWeight: 900, fontSize: '18px' }}>
                        {activeAlerts[0].type === 'RIEGO' ? 'Riego Requerido' : 'Aviso Técnico'}
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-amber-600 text-white px-2.5 py-1 rounded-full">Nueva</span>
                    </div>
                    <p className="text-sm font-extrabold truncate" style={{ color: COLORS.amber.primary, opacity: 0.95 }}>
                      {activeAlerts[0].description || 'Seguir indicaciones de riego'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={26} color={COLORS.amber.primary} className="flex-shrink-0 ml-1" />
              </button>
            )}
 
            {/* Stack of Older Active Alerts - Max 1 (index 1) to limit dashboard to exactly 2 active alerts */}
            {activeAlerts.slice(1, 2).map((alert) => {
              const isUrgent = alert.type === 'REVISAR_CULTIVO';
              const cardBg = isUrgent ? COLORS.red.pale : COLORS.amber.pale;
              const cardBorder = isUrgent ? COLORS.red.light : COLORS.amber.light;
              const primaryColor = isUrgent ? COLORS.red.primary : COLORS.amber.primary;
              
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedAlertForAction(alert)}
                  className="w-full text-left p-5 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 duration-200 transform cursor-pointer border bg-white"
                  style={{
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-white shadow-sm flex-shrink-0 border" style={{ borderColor: cardBorder }}>
                      <AlertTriangle size={26} color={primaryColor} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 leading-none mb-2">
                        <p className="font-extrabold text-base" style={{ color: primaryColor }}>
                          {isUrgent ? 'Acción urgente' : alert.type === 'RIEGO' ? 'Riego Requerido' : 'Aviso Técnico'}
                        </p>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-1 rounded-full">Anterior</span>
                      </div>
                      <p className="text-[13px] font-bold truncate" style={{ color: primaryColor, opacity: 0.85 }}>
                        {alert.description || 'Seguir indicaciones'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={22} color={primaryColor} className="flex-shrink-0 ml-1" />
                </button>
              );
            })}
          </div>
        ) : (
          /* Todo en Orden - Sleeker and less tall */
          <Link 
            href="/alerts" 
            className="w-full p-6 rounded-[32px] flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 flex-shrink-0 border-2 border-dashed bg-white shadow-sm" 
            style={{ 
              backgroundColor: COLORS.green.pale, 
              borderColor: COLORS.green.light 
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-[24px] flex items-center justify-center bg-white shadow-sm">
                <Sprout size={32} color={COLORS.green.primary} strokeWidth={3} />
              </div>
              <div>
                <p style={{ color: COLORS.green.primary, fontWeight: 900, fontSize: '20px', lineHeight: '1.2' }}>Todo en orden</p>
                <p className="text-[14px]" style={{ color: COLORS.green.primary, opacity: 0.8, fontWeight: 700 }}>Tus cultivos están sanos y seguros</p>
              </div>
            </div>
            <ChevronRight size={26} color={COLORS.green.primary} />
          </Link>
        )}
 
        {/* Navigation Grid (4 columns, super premium, tight structure) */}
        <div className="grid grid-cols-2 gap-5 flex-shrink-0">
          <Link href="/parcels" className="py-7 px-5 rounded-[36px] transition-all hover:scale-105 active:scale-95 duration-200 transform border-2 bg-white flex flex-col items-center justify-center text-center shadow-[0_6px_22px_rgba(45,106,79,0.06)] hover:shadow-[0_10px_35px_rgba(45,106,79,0.12)]" style={{ borderColor: `${COLORS.green.primary}25` }}>
            <div className="w-17 h-17 rounded-[22px] flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: COLORS.green.pale }}>
              <HomeIcon size={36} color={COLORS.green.primary} strokeWidth={3} />
            </div>
            <p className="text-lg tracking-tight" style={{ color: COLORS.green.primary, fontWeight: 900 }}>Mis Parcelas</p>
            <p className="text-xs uppercase tracking-wider mt-2 font-black text-emerald-700 bg-emerald-100/50 px-3 py-1 rounded-full">{stats.parcels} activas</p>
          </Link>

          <Link href="/data" className="py-7 px-5 rounded-[36px] transition-all hover:scale-105 active:scale-95 duration-200 transform border-2 bg-white flex flex-col items-center justify-center text-center shadow-[0_6px_22px_rgba(107,72,200,0.06)] hover:shadow-[0_10px_35px_rgba(107,72,200,0.12)]" style={{ borderColor: `${COLORS.purple.primary}25` }}>
            <div className="w-17 h-17 rounded-[22px] flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: COLORS.purple.pale }}>
              <ClipboardList size={36} color={COLORS.purple.primary} strokeWidth={3} />
            </div>
            <p className="text-lg tracking-tight" style={{ color: COLORS.purple.primary, fontWeight: 900 }}>Observar</p>
            <p className="text-xs uppercase tracking-wider mt-2 font-black text-purple-700 bg-purple-100/50 px-3 py-1 rounded-full">Salud cultivo</p>
          </Link>

          <Link href="/costs" className="py-7 px-5 rounded-[36px] transition-all hover:scale-105 active:scale-95 duration-200 transform border-2 bg-white flex flex-col items-center justify-center text-center shadow-[0_6px_22px_rgba(233,166,42,0.06)] hover:shadow-[0_10px_35px_rgba(233,166,42,0.12)]" style={{ borderColor: `${COLORS.amber.primary}25` }}>
            <div className="w-17 h-17 rounded-[22px] flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: COLORS.amber.pale }}>
              <DollarSign size={36} color={COLORS.amber.primary} strokeWidth={3} />
            </div>
            <p className="text-lg tracking-tight" style={{ color: COLORS.amber.primary, fontWeight: 900 }}>Insumos</p>
            <p className="text-xs uppercase tracking-wider mt-2 font-black text-amber-700 bg-amber-100/50 px-3 py-1 rounded-full">Gastos</p>
          </Link>

          <Link href="/climate" className="py-7 px-5 rounded-[36px] transition-all hover:scale-105 active:scale-95 duration-200 transform border-2 bg-white flex flex-col items-center justify-center text-center shadow-[0_6px_22px_rgba(58,107,201,0.06)] hover:shadow-[0_10px_35px_rgba(58,107,201,0.12)]" style={{ borderColor: `${COLORS.blue.primary}25` }}>
            <div className="w-17 h-17 rounded-[22px] flex items-center justify-center mb-2 shadow-sm" style={{ backgroundColor: COLORS.blue.pale }}>
              <Sun size={36} color={COLORS.blue.primary} strokeWidth={3} />
            </div>
            <p className="text-lg tracking-tight" style={{ color: COLORS.blue.primary, fontWeight: 900 }}>Clima</p>
            <p className="text-xs uppercase tracking-wider mt-2 font-black text-blue-700 bg-blue-100/50 px-3 py-1 rounded-full">Hoy 32°C</p>
          </Link>
        </div>
 
        {/* Consejos/Recomendaciones debajo - Solo Consejos */}
        <Link href="/recommendations" className="w-full p-6 rounded-[36px] transition-all hover:scale-[1.01] active:scale-95 shadow-[0_6px_22px_rgba(58,107,201,0.04)] hover:shadow-[0_10px_35px_rgba(58,107,201,0.12)] bg-white border border-blue-100 flex items-center gap-4 flex-shrink-0">
           <div className="w-15 h-15 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Lightbulb size={32} color={COLORS.blue.primary} strokeWidth={3} />
           </div>
           <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-gray-800 tracking-tight leading-none">Consejos y Guías</p>
              <p className="text-sm text-gray-400 font-bold mt-2 truncate">Recomendaciones personalizadas</p>
           </div>
           {stats.recommendations > 0 && (
             <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black leading-none flex items-center justify-center">
                {stats.recommendations}
             </div>
           )}
           <ChevronRight size={22} color={COLORS.gray.light} className="flex-shrink-0" />
        </Link>
      </div>

      {/* Premium Action Modal for Alert Management */}
      {selectedAlertForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div 
              className="p-5 flex items-center justify-between border-b"
              style={{ 
                backgroundColor: selectedAlertForAction.type === 'REVISAR_CULTIVO' ? COLORS.red.pale : COLORS.amber.pale,
                borderColor: selectedAlertForAction.type === 'REVISAR_CULTIVO' ? COLORS.red.light : COLORS.amber.light 
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <AlertTriangle 
                    size={20} 
                    color={selectedAlertForAction.type === 'REVISAR_CULTIVO' ? COLORS.red.primary : COLORS.amber.primary} 
                    strokeWidth={2.5}
                    className={selectedAlertForAction.type === 'REVISAR_CULTIVO' ? "animate-pulse" : ""}
                  />
                </div>
                <div>
                  <h3 
                    className="font-bold text-sm"
                    style={{ color: selectedAlertForAction.type === 'REVISAR_CULTIVO' ? COLORS.red.primary : COLORS.amber.primary }}
                  >
                    {selectedAlertForAction.type === 'REVISAR_CULTIVO' ? 'Acción Urgente' : selectedAlertForAction.type === 'RIEGO' ? 'Recordatorio de Riego' : 'Aviso Técnico'}
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium">Indicación enviada por el técnico</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAlertForAction(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Simplified Info Card - Only Fecha de envío */}
              {selectedAlertForAction.createdAt && (
                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100/80 rounded-xl flex items-center justify-center text-slate-500">
                    <Bell size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Fecha de envío</span>
                    <span className="text-sm font-extrabold text-slate-700">
                      {new Date(selectedAlertForAction.createdAt).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>
              )}

              {/* Glassmorphic card containing Technician message and Confirmation question */}
              <div className="p-5 bg-blue-50/70 backdrop-blur-md border border-blue-200/50 shadow-inner rounded-3xl text-center space-y-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full inline-block">
                    Instrucción del Técnico
                  </span>
                  <p className="text-xl font-black text-slate-800 leading-snug">
                    "{selectedAlertForAction.description || 'Seguir indicaciones de cultivo.'}"
                  </p>
                </div>
                
                <div className="h-[2px] bg-blue-200/40 w-full rounded-full" />
                
                <p className="text-lg font-black text-blue-900 leading-tight">
                  ¿Completaste esta indicación del técnico?
                </p>
              </div>
            </div>

            {/* Modal Actions - Big, accessible, tactile buttons */}
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                disabled={isUpdatingAlert}
                onClick={() => handleToggleAlertDone(selectedAlertForAction.id, false)}
                className="flex-1 py-4.5 px-4 rounded-2xl border-2 border-red-200 font-black text-base text-red-600 bg-white hover:bg-red-50 active:scale-95 transition-all text-center cursor-pointer shadow-sm"
              >
                Aún no
              </button>
              <button
                disabled={isUpdatingAlert}
                onClick={() => handleToggleAlertDone(selectedAlertForAction.id, true)}
                className="flex-1 py-4.5 px-4 rounded-2xl font-black text-base text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                {isUpdatingAlert ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} strokeWidth={3} />
                    <span>Sí, hecho</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
