"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { FarmerProfile, FarmParcel, CropObservation, InputRecord, ClimateRecord, Alert } from "@/types";
import { 
  ArrowLeft, 
  Download, 
  FileText,
  Calendar,
  DollarSign,
  Sprout,
  CloudSun,
  Users,
  Loader2,
  Printer,
  Compass,
  Bell
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";
import Image from "next/image";

type PeriodType = "Día" | "Semana" | "Mes";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>("");
  const [periodo, setPeriodo] = useState<PeriodType>("Mes");
  
  // Loaded Farmer Data States
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerProfile | null>(null);
  
  const [parcels, setParcels] = useState<FarmParcel[]>([]);
  const [observations, setObservations] = useState<CropObservation[]>([]);
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [climateRecords, setClimateRecords] = useState<ClimateRecord[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Load all available farmers for the dropdown
  useEffect(() => {
    async function loadFarmers() {
      try {
        const data = await api.getFarmers();
        setFarmers(data);
      } catch (err) {
        console.error("Error loading farmers list:", err);
      } finally {
        setLoadingFarmers(false);
      }
    }
    loadFarmers();
  }, []);

  // Load full details of the selected farmer
  useEffect(() => {
    if (!selectedFarmerId) {
      setSelectedFarmer(null);
      setParcels([]);
      setObservations([]);
      setInputs([]);
      setClimateRecords([]);
      setAlerts([]);
      return;
    }

    async function loadFarmerData() {
      setLoadingData(true);
      try {
        const farmerObj = farmers.find(f => f.id === selectedFarmerId) || null;
        setSelectedFarmer(farmerObj);

        const [parcelsRes, observationsRes, inputsRes, climateRes, alertsRes] = await Promise.all([
          api.getParcels(selectedFarmerId).catch(() => []),
          api.getObservations(selectedFarmerId).catch(() => []),
          api.getInputs(selectedFarmerId).catch(() => []),
          api.getClimateRecords(selectedFarmerId).catch(() => []),
          api.getAlerts(selectedFarmerId).catch(() => []),
        ]);

        setParcels(Array.isArray(parcelsRes) ? parcelsRes : (parcelsRes?.data || []));
        setObservations(Array.isArray(observationsRes) ? observationsRes : (observationsRes?.data || []));
        setInputs(Array.isArray(inputsRes) ? inputsRes : (inputsRes?.inputs || inputsRes?.data || []));
        setClimateRecords(Array.isArray(climateRes) ? climateRes : (climateRes?.data || []));
        setAlerts(Array.isArray(alertsRes) ? alertsRes : (alertsRes?.data || []));
      } catch (err) {
        console.error("Error loading farmer details:", err);
      } finally {
        setLoadingData(false);
      }
    }
    loadFarmerData();
  }, [selectedFarmerId, farmers]);

  // Dynamic Date Filter helper
  const filterByPeriod = <T,>(items: T[], dateField: keyof T): T[] => {
    const now = new Date();
    return items.filter(item => {
      const value = item[dateField];
      if (!value) return false;
      const itemDate = new Date(value as any);
      
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (periodo === "Día") {
        return diffDays <= 1 || itemDate.toDateString() === now.toDateString();
      } else if (periodo === "Semana") {
        return diffDays <= 7;
      } else {
        return diffDays <= 30;
      }
    });
  };

  // Filtered Datasets
  const filteredObservations = useMemo(() => filterByPeriod(observations, "createdAt"), [observations, periodo]);
  const filteredInputs = useMemo(() => filterByPeriod(inputs, "date"), [inputs, periodo]);
  const filteredClimate = useMemo(() => filterByPeriod(climateRecords, "date"), [climateRecords, periodo]);
  const filteredAlerts = useMemo(() => filterByPeriod(alerts, "createdAt"), [alerts, periodo]);

  // Statistics Computations
  const stats = useMemo(() => {
    const totalExpenses = filteredInputs.reduce((sum, item) => sum + (item.cost || 0), 0);
    
    // Climate Frequency Mode
    const climateCounts: Record<string, number> = {};
    filteredClimate.forEach(c => {
      climateCounts[c.type] = (climateCounts[c.type] || 0) + 1;
    });
    let dominantClimate = "Sin registros";
    let maxCount = 0;
    Object.entries(climateCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        dominantClimate = type;
        maxCount = count;
      }
    });

    // Crops Status Summary
    const statusCounts: Record<string, number> = {};
    filteredObservations.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    
    return {
      totalExpenses,
      dominantClimate: dominantClimate.replace('_', ' '),
      statusCounts,
      observationCount: filteredObservations.length,
      parcelsCount: parcels.length
    };
  }, [filteredObservations, filteredInputs, filteredClimate, parcels]);

  // Print trigger
  const handlePrint = () => {
    if (!selectedFarmerId) {
      alert("Por favor, selecciona un campesino primero.");
      return;
    }
    window.print();
  };

  return (
    <div className="h-full relative overflow-y-auto bg-gray-50 pb-12">
      {/* CSS para la impresión premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Reset root and scrollable parents to default layout block flow to prevent truncation */
          html, body, #__next, main, [class*="h-"], [class*="overflow-"], [class*="min-h-"] {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            position: static !important;
            max-height: none !important;
          }

          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px !important;
          }
          /* Ocultar barra superior, barra de navegación, menús de selección y botones */
          .no-print, header, nav, footer, button, select, [role="navigation"], [role="button"] {
            display: none !important;
            visibility: hidden !important;
          }
          .print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .print-break-inside {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-grid {
            display: grid !important;
            grid-template-cols: repeat(4, 1fr) !important;
            gap: 15px !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px !important;
            text-align: left !important;
          }
        }
      `}} />

      {/* Header oficial de Figma */}
      <div className="p-4 flex items-center no-print" style={{ backgroundColor: COLORS.blue.primary }}>
        <Link href="/admin" className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl flex-1 text-white font-bold">Generar Reporte</h2>
      </div>

      <div className="p-4 space-y-6 max-w-4xl mx-auto print-area">
        {/* Selector de Productor y Periodo (no-print) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4 no-print">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Seleccionar Campesino</label>
            {loadingFarmers ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Loader2 className="animate-spin" size={16} />
                <span>Cargando productores...</span>
              </div>
            ) : (
              <select 
                value={selectedFarmerId}
                onChange={(e) => setSelectedFarmerId(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccione un campesino...</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.municipality || "Sin municipio"})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <p className="mb-3 text-xs tracking-wider font-bold text-gray-500 uppercase">Período de Reporte</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Día", "Semana", "Mes"] as const).map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPeriodo(p)} 
                  className="p-3.5 rounded-xl transition-all cursor-pointer text-center text-sm" 
                  style={{ 
                    backgroundColor: periodo === p ? COLORS.blue.primary : COLORS.gray.pale, 
                    color: periodo === p ? COLORS.white : COLORS.gray.dark, 
                    fontFamily: 'DM Sans, sans-serif', 
                    fontWeight: periodo === p ? 700 : 600, 
                    border: `2px solid ${periodo === p ? COLORS.blue.primary : COLORS.gray.light}` 
                  }}
                >
                  {p === "Día" ? "Día (Hoy)" : p === "Semana" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Spinner for Details */}
        {loadingData && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 no-print">
            <Loader2 className="animate-spin mb-3 text-blue-600" size={36} />
            <p className="font-semibold text-sm">Compilando datos del campesino...</p>
          </div>
        )}

        {/* Report Preview */}
        {!loadingData && selectedFarmer && (
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-lg space-y-8 animate-in fade-in duration-300">
            {/* Cabecera del Reporte Impreso */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Image 
                    src="/Smart_Farming_Logo.png" 
                    alt="Magdalena Smart Farming Logo" 
                    width={36} 
                    height={36} 
                    className="object-contain"
                  />
                  <span className="text-sm font-bold tracking-widest text-green-700 uppercase">Magdalena Smart Farming</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Informe de Seguimiento Técnico</h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
                  Periodo analizado: <strong className="text-gray-600 font-semibold">{periodo === "Día" ? "Últimas 24 horas" : periodo === "Semana" ? "Últimos 7 días" : "Últimos 30 días"}</strong>
                </p>
              </div>
              <div className="text-left md:text-right mt-4 md:mt-0 text-xs text-gray-400 font-medium">
                <p>Fecha Generación: <strong className="text-gray-600">{new Date().toLocaleDateString('es-CO')}</strong></p>
                <p>Técnico Supervisor: <strong className="text-gray-600">{user?.data?.name || "Técnico Asignado"}</strong></p>
              </div>
            </div>

            {/* Ficha Técnica Campesino */}
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Productor</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedFarmer.name}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Municipio</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedFarmer.municipality || "N/D"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Vereda</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedFarmer.vereda || "N/D"}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">ID Productor</span>
                <p className="font-bold text-gray-500 text-xs mt-1 truncate">{selectedFarmer.id}</p>
              </div>
            </div>

            {/* Resumen de Métricas Clave (Print Grid) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print-grid">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                <Sprout size={24} className="text-green-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Parcelas</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.parcelsCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                <FileText size={24} className="text-blue-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Observaciones</p>
                <p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.observationCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                <DollarSign size={24} className="text-amber-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Gastos Insumos</p>
                <p className="text-xl font-bold text-gray-800 mt-1">
                  ${stats.totalExpenses.toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm text-center">
                <CloudSun size={24} className="text-purple-600 mx-auto mb-1.5" />
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Clima Dominante</p>
                <p className="text-sm font-bold text-gray-800 mt-2 capitalize truncate">{stats.dominantClimate.toLowerCase()}</p>
              </div>
            </div>

            {/* Listado de Parcelas */}
            <div className="print-break-inside">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Compass size={18} className="text-green-700" />
                <span>1. Estructura y Parcelas Registradas</span>
              </h3>
              {parcels.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Nombre de Parcela</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Cultivo Sembrado</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-600">Área (Hectáreas)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                      {parcels.map(p => (
                        <tr key={p.id}>
                          <td className="px-4 py-3 font-semibold text-gray-800">{p.name || "Parcela General"}</td>
                          <td className="px-4 py-3 capitalize">{p.cropType}</td>
                          <td className="px-4 py-3 text-right">{p.area} ha</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">El campesino no posee parcelas registradas.</p>
              )}
            </div>

            {/* Listado de Salud y Observaciones */}
            <div className="print-break-inside">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText size={18} className="text-blue-700" />
                <span>2. Estado Fitosanitario de los Cultivos</span>
              </h3>
              {filteredObservations.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Fecha</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Estado Diagnóstico</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Notas / Hallazgos</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                      {filteredObservations.map(o => (
                        <tr key={o.id}>
                          <td className="px-4 py-3 text-xs">
                            {new Date(o.createdAt).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                o.status === "SANO" ? "bg-green-100 text-green-800" :
                                o.status === "MANCHAS_NEGRAS" || o.status === "HOJAS_SECAS" ? "bg-red-100 text-red-800" :
                                "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {o.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 leading-relaxed">{o.notes || "Sin notas específicas"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No se han registrado observaciones en este periodo.</p>
              )}
            </div>

            {/* Listado de Insumos y Gastos */}
            <div className="print-break-inside">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={18} className="text-amber-700" />
                <span>3. Adquisición de Insumos e Inversión</span>
              </h3>
              {filteredInputs.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Fecha</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Insumo</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-600">Cantidad</th>
                        <th className="px-4 py-3 text-right font-bold text-gray-600">Costo Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                      {filteredInputs.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-xs">
                            {new Date(item.date).toLocaleDateString('es-CO')}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-800">{item.name}</td>
                          <td className="px-4 py-3 text-right">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900">
                            ${(item.cost || 0).toLocaleString('es-CO', { minimumFractionDigits: 0 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No hay registros de compras de insumos en este periodo.</p>
              )}
            </div>

            {/* Listado de Clima */}
            <div className="print-break-inside">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CloudSun size={18} className="text-purple-700" />
                <span>4. Condiciones Agroclimáticas Registradas</span>
              </h3>
              {filteredClimate.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print-grid">
                  {filteredClimate.slice(0, 12).map(c => (
                    <div key={c.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-500">
                        {new Date(c.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-100 text-blue-800 font-bold uppercase text-[9px]">
                        {c.type}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">No se reportaron registros climáticos en este periodo.</p>
              )}
            </div>

            {/* Listado de Alertas e Indicaciones */}
            <div className="print-break-inside">
              <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Bell size={18} className="text-red-700" />
                <span>5. Alertas e Indicaciones Enviadas</span>
              </h3>
              {filteredAlerts.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Fecha y Hora</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Tipo de Alerta</th>
                        <th className="px-4 py-3 text-left font-bold text-gray-600">Indicación / Instrucción</th>
                        <th className="px-4 py-3 text-center font-bold text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                      {filteredAlerts.map(alert => (
                        <tr key={alert.id}>
                          <td className="px-4 py-3 text-xs">
                            {new Date(alert.createdAt).toLocaleDateString('es-CO', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })} - {alert.hour} hs
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                alert.type === "REVISAR_CULTIVO" ? "bg-red-100 text-red-800" :
                                alert.type === "RIEGO" ? "bg-blue-100 text-blue-800" :
                                "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {alert.type === "REVISAR_CULTIVO" ? "Urgente" : alert.type === "RIEGO" ? "Riego" : "Aviso Técnico"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 leading-relaxed">{alert.description || "Sin descripción adicional"}</td>
                          <td className="px-4 py-3 text-center">
                            {alert.isActive ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800">
                                Activa
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800">
                                Completada
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-400 bg-gray-50 p-4 rounded-xl text-center">
                  No se reportaron alertas o indicaciones técnicas enviadas en este periodo.
                </p>
              )}
            </div>

            {/* Firmas de Control de Calidad */}
            <div className="pt-12 grid grid-cols-2 gap-8 text-center border-t border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider print-break-inside">
              <div>
                <div className="w-44 border-b border-gray-300 mx-auto mb-2 h-10"></div>
                <p className="text-gray-700 font-bold">{user?.data?.name || "Técnico Supervisor"}</p>
                <p className="text-[10px] text-gray-400">Firma Técnico Magdalena Smart Farming</p>
              </div>
              <div>
                <div className="w-44 border-b border-gray-300 mx-auto mb-2 h-10"></div>
                <p className="text-gray-700 font-bold">{selectedFarmer.name}</p>
                <p className="text-[10px] text-gray-400">Firma Productor Agricultor</p>
              </div>
            </div>
          </div>
        )}

        {/* Selector Empty State */}
        {!selectedFarmerId && (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 no-print">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={36} className="text-blue-500 opacity-60" />
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-1">Sin Campesino Seleccionado</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto px-4">
              Por favor, selecciona un productor en el panel superior para cargar y estructurar su reporte de actividad.
            </p>
          </div>
        )}

        {/* Action Buttons (no-print) */}
        {selectedFarmer && (
          <div className="flex gap-4 no-print pt-4">
            <button 
              onClick={handlePrint}
              className="flex-1 p-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-md transition-all hover:scale-[1.01] active:scale-95 cursor-pointer font-bold text-white bg-blue-600"
            >
              <Printer size={20} strokeWidth={2.5} />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
