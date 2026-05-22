"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { api } from "@/lib/api";
import { FarmParcel, CropObservation } from "@/types";
import { 
  Plus, 
  ArrowLeft, 
  ChevronRight,
  CheckCircle,
  Sprout,
  ClipboardList
} from "lucide-react";
import { COLORS } from "@/lib/design-system";

export default function CropsPage() {
  const { user, isOnline } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  const [parcels, setParcels] = useState<FarmParcel[]>([]);
  const [observations, setObservations] = useState<CropObservation[]>([]);
  const [step, setStep] = useState<"list" | "select-parcel" | "add">("list");
  const [selectedParcel, setSelectedParcel] = useState<FarmParcel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [newObservation, setNewObservation] = useState({
    status: "SANO",
    notes: ""
  });

  const loadData = async () => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [pData, oData] = await Promise.all([
        api.getParcels(farmerId).catch(() => db.parcels.where("farmerId").equals(farmerId).toArray()),
        api.getObservations(farmerId).catch(() => db.observations.where("farmerId").equals(farmerId).toArray())
      ]);
      setParcels(Array.isArray(pData) ? pData : (pData as any).data || []);
      setObservations(Array.isArray(oData) ? oData : (oData as any).data || []);
    } catch (err) {
      console.error("Error loading data:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [farmerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId || !selectedParcel) return;
    
    const observationData = {
      ...newObservation,
      farmerId,
      parcelId: selectedParcel.id
    };

    try {
      if (isOnline) {
        await api.createObservation(observationData);
      } else {
        await db.observations.add({
          ...observationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
          syncStatus: 'PENDIENTE'
        } as any);
      }
      setStep("list");
      setNewObservation({ status: "SANO", notes: "" });
      loadData();
    } catch (err) {
      alert("Error al registrar observación");
    }
  };

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header */}
      <div className="p-4 flex items-center" style={{ backgroundColor: COLORS.purple.primary }}>
        <button 
          onClick={() => step === "list" ? window.history.back() : setStep(step === "add" ? "select-parcel" : "list")} 
          className="p-2 rounded-xl mr-3" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        >
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </button>
        <h2 className="text-xl flex-1" style={{ color: COLORS.white, fontWeight: 700 }}>
          {step === "list" ? "Observaciones" : step === "select-parcel" ? "Seleccionar Parcela" : "Registrar Estado"}
        </h2>
      </div>

      <div className="p-4">
        {step === "list" && (
          <div className="space-y-4">
             <div className="bg-purple-50 p-6 rounded-2xl border-2 border-purple-100 flex items-center justify-between">
                <div>
                  <p className="text-purple-900 font-bold text-xl">{observations.length}</p>
                  <p className="text-purple-700 text-sm">Registros totales</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                   <ClipboardList size={24} color={COLORS.purple.primary} />
                </div>
             </div>

             <div className="space-y-3">
                <h3 className="font-bold text-gray-800">Historial Reciente</h3>
                {observations.map((obs) => (
                  <div key={obs.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className={`w-3 h-3 rounded-full ${obs.status === 'SANO' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                       <div>
                         <p className="text-sm font-bold text-gray-800">{obs.status.replace('_', ' ')}</p>
                         <p className="text-[10px] text-gray-500">{new Date(obs.createdAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                    {obs.notes && <p className="text-[10px] text-gray-400 max-w-[100px] truncate">{obs.notes}</p>}
                  </div>
                ))}
                {observations.length === 0 && (
                  <p className="text-center py-10 text-gray-400 text-sm italic">No hay registros aún</p>
                )}
             </div>

             <button onClick={() => setStep("select-parcel")} className="w-full mt-6 p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.purple.primary, color: COLORS.white, fontWeight: 700 }}>
                <Plus size={20} />
                <span>Nueva Observación</span>
             </button>
          </div>
        )}

        {step === "select-parcel" && (
          <div className="space-y-4">
            <p className="font-bold text-gray-600 mb-2">¿En cuál parcela?</p>
            <div className="space-y-3">
              {parcels.map((parcel) => (
                <button 
                  key={parcel.id} 
                  onClick={() => { setSelectedParcel(parcel); setStep("add"); }}
                  className="w-full p-5 rounded-2xl flex items-center gap-3 transition-all border-2 border-gray-100 bg-white hover:border-purple-300"
                >
                  <div className="text-2xl">{parcel.icon || "🌿"}</div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-gray-800">{parcel.name}</p>
                    <p className="text-xs text-gray-500">{parcel.cropType}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "add" && selectedParcel && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-purple-50 rounded-2xl flex items-center gap-3 border border-purple-100">
               <span className="text-2xl">{selectedParcel.icon}</span>
               <div>
                  <p className="font-bold text-purple-900">{selectedParcel.name}</p>
                  <p className="text-xs text-purple-700">{selectedParcel.cropType}</p>
               </div>
            </div>

            <div>
              <label className="block mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Estado del Cultivo</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'SANO', label: 'Sano', icon: '✅' },
                  { id: 'HOJAS_AMARILLAS', label: 'Hojas Amarillas', icon: '🟡' },
                  { id: 'MANCHAS_NEGRAS', label: 'Manchas Negras', icon: '⚫' },
                  { id: 'HOJAS_SECAS', label: 'Hojas Secas', icon: '🍂' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNewObservation({...newObservation, status: s.id})}
                    className={`p-4 rounded-xl flex flex-col items-center gap-2 border-2 transition-all ${newObservation.status === s.id ? 'border-purple-500 bg-purple-50' : 'border-gray-100 bg-gray-50'}`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-[10px] font-bold text-center text-gray-900">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Notas Adicionales</label>
              <textarea 
                value={newObservation.notes}
                onChange={e => setNewObservation({...newObservation, notes: e.target.value})}
                placeholder="Describe lo que observas..."
                className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-purple-500 focus:outline-none transition-all resize-none h-32 text-gray-900"
              />
            </div>

            <button type="submit" className="w-full p-4 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: COLORS.purple.primary, color: COLORS.white, fontWeight: 700 }}>
              <CheckCircle size={20} />
              <span>Guardar Observación</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
