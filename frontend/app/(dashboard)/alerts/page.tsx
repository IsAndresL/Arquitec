"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db, addToSyncQueue, addActivityLog } from "@/lib/db";
import { api } from "@/lib/api";
import { Alert } from "@/types";
import { 
  ArrowLeft, 
  CheckCircle,
  AlertTriangle,
  Clock,
  Info,
  ChevronRight,
  Check,
  X,
  Bell
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function AlertsPage() {
  const { user } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlertForAction, setSelectedAlertForAction] = useState<Alert | null>(null);
  const [isUpdatingAlert, setIsUpdatingAlert] = useState(false);

  const loadData = async () => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getAlerts(farmerId);
      const alertsData = Array.isArray(res) ? res : (res?.data || []);
      setAlerts(alertsData.filter((a: Alert) => a.isActive));
      
      if (alertsData.length > 0) await db.alerts.bulkPut(alertsData);
    } catch (err) {
      console.error("Error loading alerts:", err);
      setAlerts(await db.alerts.where("farmerId").equals(farmerId).toArray());
    }
    setIsLoading(false);
  };

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
        console.warn("[Alerts] Falló actualización en API, se actualizará localmente:", apiErr);
      }

      // 2. Update locally in Dexie IndexedDB
      await db.alerts.update(alertId, { isActive: false, syncStatus: "PENDIENTE" });

      // 3. Queue offline sync
      await addToSyncQueue("alerts", alertId, { id: alertId, isActive: false, farmerId });

      // 4. Log activity
      await addActivityLog(
        "ALERTA_RESOLVIDA",
        `Alerta marcada como completada desde notificaciones`,
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
    loadData();
  }, [farmerId]);

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-5 flex items-center rounded-b-[30px] flex-shrink-0" style={{ backgroundColor: COLORS.red.primary }}>
        <Link href="/dashboard" className="p-3 rounded-xl mr-4 hover:opacity-90 active:scale-95 transition-all" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={22} color={COLORS.white} strokeWidth={3} />
        </Link>
        <h2 className="text-xl flex-1 text-white font-black">Mis Alertas de Cultivo</h2>
      </div>

      {/* Content wrapper */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: COLORS.gray.pale }}>
        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.red.primary }}></div>
            </div>
          ) : (
            <>
              {alerts.map((alert) => {
                const isUrgent = alert.type === 'REVISAR_CULTIVO';
                const cardBg = isUrgent ? COLORS.red.pale : COLORS.amber.pale;
                const cardBorder = isUrgent ? COLORS.red.light : COLORS.amber.light;
                const primaryColor = isUrgent ? COLORS.red.primary : COLORS.amber.primary;
                const titleText = isUrgent ? 'Acción urgente' : alert.type === 'RIEGO' ? 'Riego Requerido' : 'Aviso Técnico';

                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelectedAlertForAction(alert)}
                    className="w-full text-left p-5 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.01] active:scale-95 duration-200 transform cursor-pointer border bg-white shadow-sm"
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                    }}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-13 h-13 rounded-2xl flex items-center justify-center bg-white shadow-sm flex-shrink-0 border" style={{ borderColor: cardBorder }}>
                        <AlertTriangle size={26} color={primaryColor} strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 leading-none mb-2">
                          <p className="font-extrabold text-base" style={{ color: primaryColor }}>
                            {titleText}
                          </p>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-white/90 border px-2 py-0.5 rounded-full inline-block" style={{ borderColor: cardBorder, color: primaryColor }}>
                            Activa
                          </span>
                        </div>
                        <p className="text-[13px] font-bold truncate text-slate-600">
                          {alert.description || 'Seguir indicaciones'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={22} color={primaryColor} className="flex-shrink-0 ml-1" />
                  </button>
                );
              })}
              
              {alerts.length === 0 && (
                <div className="text-center py-20 bg-white border border-dashed rounded-[36px] p-8 shadow-sm">
                   <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-green-100">
                      <CheckCircle size={42} className="text-green-500" strokeWidth={2.5} />
                   </div>
                   <p className="text-slate-800 font-black text-lg mb-1.5">¡Todo en orden por aquí!</p>
                   <p className="text-slate-400 text-xs font-bold leading-relaxed">No tienes alertas pendientes ni indicaciones sin resolver en tus parcelas.</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-6 bg-blue-50/70 border border-blue-200/50 rounded-[32px] shadow-sm flex items-start gap-4">
           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-200 flex-shrink-0">
             <Info size={24} className="text-blue-500" strokeWidth={2.5} />
           </div>
           <div className="min-w-0 flex-1">
             <p className="font-black text-blue-900 text-sm mb-1">Indicaciones Importantes</p>
             <p className="text-xs text-blue-700 font-bold leading-relaxed">
               Estas advertencias son generadas para el cuidado óptimo de tus cultivos. Al completarlas, márcalas como resueltas para notificar a tu técnico supervisor.
             </p>
           </div>
        </div>
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

              {/* Glassmorphic card containing message and Confirmation question */}
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
