"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { FarmerProfile, ClimateRecord, InputRecord, CropObservation, FarmParcel } from "@/types";
import { 
  ArrowLeft, 
  MapPin, 
  Sun, 
  DollarSign, 
  Sprout, 
  Map as MapIcon,
  Calendar,
  AlertTriangle,
  FileText,
  Trash2
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function FarmerDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [climate, setClimate] = useState<ClimateRecord[]>([]);
  const [inputs, setInputs] = useState<InputRecord[]>([]);
  const [observations, setObservations] = useState<CropObservation[]>([]);
  const [parcels, setParcels] = useState<FarmParcel[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [newPin, setNewPin] = useState("");
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState("");
  const [pinErrorMsg, setPinErrorMsg] = useState("");

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinErrorMsg("El PIN debe tener exactamente 4 números.");
      return;
    }
    
    setIsUpdatingPin(true);
    setPinSuccessMsg("");
    setPinErrorMsg("");
    try {
      const farmerId = Array.isArray(id) ? id[0] : (id as string);
      await api.updateFarmer(farmerId, { pin: newPin });
      setPinSuccessMsg("PIN actualizado correctamente. Ahora el campesino puede ingresar con su nuevo PIN.");
      setNewPin("");
    } catch (err: any) {
      console.error(err);
      setPinErrorMsg(err.message || "Error al actualizar el PIN.");
    } finally {
      setIsUpdatingPin(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const farmerId = Array.isArray(id) ? id[0] : (id as string);
        if (!farmerId) return;
        
        // Cargar todo en paralelo
        const [fData, cData, iData, oData, pData] = await Promise.all([
          api.getFarmer(farmerId),
          api.getClimateRecords(farmerId),
          api.getInputs(farmerId),
          api.getObservations(farmerId),
          api.getParcels(farmerId)
        ]);
        
        setFarmer(fData);
        setClimate(cData);
        setInputs(Array.isArray(iData) ? iData : iData.inputs || []);
        setObservations(oData);
        setParcels(pData);
      } catch (err) {
        console.error("Error al cargar detalles del campesino", err);
      }
      setIsLoading(false);
    }
    
    if (id) loadData();
  }, [id]);

  if (isLoading) {
    return <div className="p-10 text-center font-bold text-gray-500">Cargando detalles...</div>;
  }

  if (!farmer) {
    return (
      <div className="p-10 text-center flex flex-col items-center">
        <p className="text-gray-500 mb-4 font-bold">Productor no encontrado.</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Volver</button>
      </div>
    );
  }

  const initials = farmer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleDeleteFarmer = async () => {
    const farmerId = Array.isArray(id) ? id[0] : (id as string);
    if (!farmerId || !farmer) return;
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar permanentemente el perfil de ${farmer.name}? Esta acción no se puede deshacer y borrará todos sus datos asociados.`
    );
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await api.deleteFarmer(farmerId);
      router.push("/admin/farmers");
    } catch (err) {
      console.error(err);
      alert("Error al eliminar perfil");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="p-4 pb-12 rounded-b-[40px] relative" style={{ backgroundColor: COLORS.blue.primary }}>
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
            <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
          </button>
          <h2 className="text-xl flex-1 text-white font-bold font-dm">Detalle de Productor</h2>
        </div>
        
        <div className="flex flex-col items-center text-center -mb-20">
          <div className="w-24 h-24 rounded-full bg-white mb-4 flex items-center justify-center shadow-lg border-4 border-white/20">
             <span className="text-3xl font-bold text-blue-600">{initials}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{farmer.name}</h1>
          <div className="flex items-center gap-1 text-gray-700 bg-white/95 px-3 py-1 rounded-full shadow-sm text-xs font-bold">
            <MapPin size={12} className="text-blue-500" />
            {farmer.municipality || "Sin municipio"} • {farmer.vereda || "Sin vereda"}
          </div>
        </div>
      </div>

      <div className="p-4 mt-24 space-y-6">
        
        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="p-3 bg-amber-50 rounded-xl text-amber-500">
               <Sun size={24} />
             </div>
             <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase">Registros Clima</p>
               <p className="text-xl font-black text-gray-800">{climate.length}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="p-3 bg-green-50 rounded-xl text-green-500">
               <Sprout size={24} />
             </div>
             <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase">Observaciones</p>
               <p className="text-xl font-black text-gray-800">{observations.length}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="p-3 bg-blue-50 rounded-xl text-blue-500">
               <DollarSign size={24} />
             </div>
             <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase">Insumos (Costos)</p>
               <p className="text-xl font-black text-gray-800">{inputs.length}</p>
             </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="p-3 bg-purple-50 rounded-xl text-purple-500">
               <MapIcon size={24} />
             </div>
             <div>
               <p className="text-[10px] text-gray-400 font-bold uppercase">Parcelas</p>
               <p className="text-xl font-black text-gray-800">{parcels.length}</p>
             </div>
          </div>
        </div>

        {/* Resumen de Parcelas */}
        {parcels.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MapIcon size={18} className="text-purple-500" /> 
              Parcelas Registradas
            </h3>
            <div className="space-y-3">
              {parcels.map(parcel => (
                <div key={parcel.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{parcel.icon || "🌿"}</span>
                    <div>
                      <p className="font-bold text-sm text-gray-700">{parcel.name || "Sin nombre"}</p>
                      <p className="text-xs text-gray-400 uppercase">
                        {parcel.cropType}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-purple-600">{parcel.area} ha</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de Insumos */}
        {inputs.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign size={18} className="text-blue-500" /> 
              Últimos Insumos Reportados
            </h3>
            <div className="space-y-3">
              {inputs.slice(0, 3).map(input => (
                <div key={input.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <p className="font-bold text-sm text-gray-700">{input.name}</p>
                    <p className="text-xs text-gray-400 uppercase">
                      {input.quantity} {(input as any).unit || 'unidades'}
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">${input.cost?.toLocaleString() || 0}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de Clima */}
        {climate.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sun size={18} className="text-amber-500" /> 
              Registros Climáticos Recientes
            </h3>
            <div className="space-y-3">
              {climate.slice(0, 3).map(rec => (
                <div key={rec.id} className="flex items-center gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <Calendar size={18} className="text-amber-500" />
                  <span className="text-sm font-bold text-gray-700">{new Date(rec.date).toLocaleDateString()}</span>
                  <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded-lg ml-auto">
                    {rec.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumen de Observaciones */}
        {observations.length > 0 && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Sprout size={18} className="text-green-500" /> 
              Observaciones de Cultivo
            </h3>
            <div className="space-y-3">
              {observations.slice(0, 3).map(obs => (
                <div key={obs.id} className="p-3 bg-green-50/50 rounded-xl border border-green-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-lg uppercase">
                      {(obs as any).status || 'SANO'}
                    </span>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(obs.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-700 mt-2">
                    {(obs as any).notes || 'Sin detalles'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {(climate.length === 0 && inputs.length === 0 && observations.length === 0 && parcels.length === 0) && (
          <div className="p-8 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <FileText size={24} />
            </div>
            <p className="text-gray-500 font-bold mb-2">Sin actividad reciente</p>
            <p className="text-xs text-gray-400">El campesino aún no ha registrado datos climáticos, insumos u observaciones.</p>
          </div>
        )}

        {/* Sección de Seguridad / PIN */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </span>
            Seguridad & PIN de Acceso
          </h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            El PIN de acceso del campesino se almacena encriptado para su seguridad. Si el productor lo olvidó o deseas cambiarlo, puedes asignar uno nuevo de 4 dígitos a continuación:
          </p>

          <form onSubmit={handleUpdatePin} className="flex gap-2">
            <input
              type="text"
              maxLength={4}
              placeholder="Ej. 1234"
              value={newPin}
              onChange={(e) => {
                setPinSuccessMsg("");
                setPinErrorMsg("");
                setNewPin(e.target.value.replace(/\D/g, ''));
              }}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-center text-lg font-bold font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all tracking-widest"
            />
            <button
              type="submit"
              disabled={isUpdatingPin || newPin.length !== 4}
              className="px-6 py-3 rounded-xl text-white font-extrabold text-xs shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.blue.primary }}
            >
              {isUpdatingPin ? "Guardando..." : "Asignar PIN"}
            </button>
          </form>

          {pinSuccessMsg && (
            <p className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse animate-duration-1000"></span>
              {pinSuccessMsg}
            </p>
          )}

          {pinErrorMsg && (
            <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"></span>
              {pinErrorMsg}
            </p>
          )}
        </div>

        {/* Botón de Eliminar Campesino (Relocalizado) */}
        <div className="pt-6">
          <button 
            onClick={handleDeleteFarmer}
            disabled={isDeleting}
            className="w-full py-4 px-6 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 transition-all border-2 border-red-200/50 flex items-center justify-center gap-3 text-red-600 font-extrabold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-600 border-t-transparent" />
            ) : (
              <Trash2 size={20} />
            )}
            <span>Eliminar Perfil de Campesino</span>
          </button>
        </div>

      </div>
    </div>
  );
}
