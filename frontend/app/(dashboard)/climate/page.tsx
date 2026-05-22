"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle2, 
  Sun, 
  Cloud, 
  CloudRain, 
  Wind,
  History,
  Info
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { db } from "@/lib/db";
import { ClimateRecord } from "@/types";

export default function ClimatePage() {
  const router = useRouter();
  const { user, isOnline } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [climateType, setClimateType] = useState<'SOL' | 'NUBLADO' | 'LLUVIA' | 'VIENTO'>('SOL');
  const [notes, setNotes] = useState("");
  const [history, setHistory] = useState<ClimateRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fecha actual formateada (ej. 4 de mayo, 2026)
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  const formattedDate = today.toLocaleDateString('es-ES', options);

  const loadHistory = async () => {
    if (!farmerId) return;
    setIsLoadingHistory(true);
    try {
      let data: ClimateRecord[] = [];
      try {
        const res = await api.getClimateRecords(farmerId);
        data = Array.isArray(res) ? res : (res?.data || []);
        if (data.length > 0) await db.climateRecords.bulkPut(data);
      } catch (err) {
        console.error("Error fetching climate from API:", err);
      }
      
      if (data.length === 0) {
        data = await db.climateRecords.where("farmerId").equals(farmerId).toArray();
      }
      // Ordenar por fecha descendente
      setHistory(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      console.error("Error loading climate history:", err);
    }
    setIsLoadingHistory(false);
  };

  useEffect(() => {
    loadHistory();
  }, [farmerId]);

  const handleSave = async () => {
    if (!farmerId) {
      alert("No se encontró el ID del campesino");
      return;
    }
    setIsSubmitting(true);
    
    const climateData = {
      date: new Date().toISOString(),
      type: climateType,
      notes,
      farmerId
    };

    try {
      if (isOnline) {
        await api.createClimateRecord(climateData);
      } else {
        await db.climateRecords.add({
          ...climateData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'PENDIENTE'
        } as any);
      }
      alert("Clima guardado exitosamente");
      setNotes("");
      loadHistory();
    } catch (err) {
      console.error("Error al guardar clima:", err);
      alert("Error al guardar clima");
    }
    setIsSubmitting(false);
  };

  const getClimateIcon = (type: string) => {
    switch (type) {
      case 'SOL': return <Sun size={20} color="#f59e0b" />;
      case 'NUBLADO': return <Cloud size={20} color="#64748b" />;
      case 'LLUVIA': return <CloudRain size={20} color="#3b82f6" />;
      case 'VIENTO': return <Wind size={20} color="#10b981" />;
      default: return <Sun size={20} />;
    }
  };

  return (
    <div className="min-h-screen relative bg-white flex flex-col pb-24">
      {/* Header Clima */}
      <div className="p-4 flex items-center pt-8 rounded-b-[40px]" style={{ backgroundColor: COLORS.amber.primary }}>
        <Link href="/dashboard" className="p-2 rounded-xl mr-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={24} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-2xl flex-1" style={{ color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>
          Clima del Día
        </h2>
      </div>

      <div className="p-6 -mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
          <p className="mb-2 text-xs font-bold tracking-wider" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>
            FECHA
          </p>
          <div className="flex items-center gap-3 p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.gray.pale, border: `2px solid ${COLORS.gray.light}` }}>
            <Calendar size={24} color={COLORS.amber.primary} strokeWidth={2.5} />
            <span style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', fontSize: '18px', fontWeight: 600 }}>
              {formattedDate}
            </span>
          </div>

          <p className="mb-2 text-xs font-bold tracking-wider" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>
            ESTADO DEL CLIMA
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { id: 'SOL', label: 'Sol', icon: Sun, color: '#f59e0b' },
              { id: 'NUBLADO', label: 'Nublado', icon: Cloud, color: '#64748b' },
              { id: 'LLUVIA', label: 'Lluvia', icon: CloudRain, color: '#3b82f6' },
              { id: 'VIENTO', label: 'Viento', icon: Wind, color: '#10b981' }
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setClimateType(c.id as any)}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all active:scale-95 ${climateType === c.id ? 'border-amber-500 bg-amber-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <Icon size={28} color={c.color} strokeWidth={2.5} />
                  <span className="text-[10px] font-bold text-center text-gray-900">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Anotaciones</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="¿Alguna observación especial sobre el clima de hoy?"
              className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-amber-500 focus:outline-none transition-all h-24 text-gray-900 font-medium"
            />
          </div>

          <div className="flex gap-3">
             <button 
                type="button"
                onClick={() => router.push("/dashboard")}
                className="flex-1 p-4 rounded-2xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
             >
                Cancelar
             </button>
             <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-[2] p-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50" 
                style={{ backgroundColor: COLORS.amber.primary, color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '18px' }}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                    <span>Guardar</span>
                  </>
                )}
             </button>
          </div>
        </div>

        {/* Historial de Clima */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <History size={20} color={COLORS.gray.medium} />
              <h3 className="font-bold text-gray-700">Historial Reciente</h3>
           </div>

           {isLoadingHistory ? (
             <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
             </div>
           ) : (
             <div className="space-y-3">
                {history.map((record) => (
                  <div key={record.id} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                        {getClimateIcon(record.type)}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <p className="font-bold text-gray-800">{record.type}</p>
                           <p className="text-[10px] font-bold text-gray-400 uppercase">
                              {new Date(record.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                           </p>
                        </div>
                        {record.notes ? (
                          <p className="text-xs text-gray-600 line-clamp-1 italic">"{record.notes}"</p>
                        ) : (
                          <p className="text-xs text-gray-400">Sin notas</p>
                        )}
                     </div>
                  </div>
                ))}
                {history.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                     <Info size={32} className="mx-auto mb-2 text-gray-300" />
                     <p className="text-gray-400 text-sm font-medium">No hay registros previos</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
