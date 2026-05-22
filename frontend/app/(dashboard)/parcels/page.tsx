"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/db";
import { api } from "@/lib/api";
import { FarmParcel } from "@/types";
import { 
  Plus, 
  ArrowLeft, 
  Trash2, 
  Edit, 
  Info,
  CheckCircle,
  XCircle,
  MapPin,
  Sprout
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function ParcelsPage() {
  const { user, isOnline } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  const [parcels, setParcels] = useState<FarmParcel[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingParcel, setEditingParcel] = useState<FarmParcel | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    area: "",
    cropType: "Banano",
    otherCrop: "",
    icon: "sprout"
  });

  const loadParcels = async () => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let data: FarmParcel[] = [];
      try {
        const res = await api.getParcels(farmerId);
        data = Array.isArray(res) ? res : (res?.data || []);
        if (data.length > 0) await db.parcels.bulkPut(data);
      } catch (err) {
        console.error("Error fetching parcels from API:", err);
      }
      
      if (data.length === 0) {
        data = await db.parcels.where("farmerId").equals(farmerId).toArray();
      }
      setParcels(data);
    } catch (err) {
      console.error("Error loading parcels:", err);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadParcels();
  }, [farmerId]);

  const handleOpenCreate = () => {
    setEditingParcel(null);
    setFormData({ name: "", area: "", cropType: "Banano", otherCrop: "", icon: "sprout" });
    setShowModal(true);
  };

  const handleOpenEdit = (parcel: FarmParcel) => {
    setEditingParcel(parcel);
    const standardCrops = ["Banano", "Yuca", "Plátano", "Maíz"];
    const isOther = !standardCrops.includes(parcel.cropType);
    setFormData({
      name: parcel.name || "",
      area: parcel.area.toString(),
      cropType: isOther ? "Otro" : parcel.cropType,
      otherCrop: isOther ? parcel.cropType : "",
      icon: parcel.icon || "sprout"
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar esta parcela? Esta acción no se puede deshacer.")) return;
    
    try {
      if (isOnline) {
        await api.deleteParcel(id);
      }
      await db.parcels.delete(id);
      loadParcels();
    } catch (err) {
      alert("Error al eliminar la parcela");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmerId) return;
    
    const area = parseFloat(formData.area);
    if (isNaN(area) || area <= 0) {
      alert("Por favor ingresa un área válida (mayor a 0)");
      return;
    }

    const cropType = formData.cropType === "Otro" ? formData.otherCrop : formData.cropType;
    if (!cropType) {
      alert("Por favor especifica el tipo de cultivo");
      return;
    }

    const parcelData = {
      name: formData.name,
      area,
      cropType,
      icon: formData.icon,
      farmerId
    };

    try {
      if (editingParcel) {
        if (isOnline) {
          await api.updateParcel(editingParcel.id, parcelData);
        } else {
          await db.parcels.update(editingParcel.id, {
            ...parcelData,
            updatedAt: new Date(),
            syncStatus: 'PENDIENTE'
          });
        }
      } else {
        if (isOnline) {
          await api.createParcel(parcelData);
        } else {
          await db.parcels.add({
            ...parcelData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            syncStatus: 'PENDIENTE',
          } as any);
        }
      }
      setShowModal(false);
      loadParcels();
    } catch (err) {
      alert(`Error al ${editingParcel ? 'actualizar' : 'crear'} parcela`);
    }
  };

  const totalArea = parcels.reduce((sum, p) => sum + p.area, 0);

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header */}
      <div className="p-4 flex items-center" style={{ backgroundColor: COLORS.green.primary }}>
        <Link href="/dashboard" className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl flex-1" style={{ color: COLORS.white, fontWeight: 700 }}>Mis Parcelas</h2>
      </div>

      {/* Estadísticas */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: COLORS.green.pale }}>
            <p className="text-xs mb-1" style={{ color: COLORS.gray.medium }}>Parcelas</p>
            <p className="text-3xl" style={{ color: COLORS.green.primary, fontWeight: 700 }}>{parcels.length}</p>
          </div>
          <div className="text-center p-4 rounded-xl" style={{ backgroundColor: COLORS.green.pale }}>
            <p className="text-xs mb-1" style={{ color: COLORS.gray.medium }}>Hectáreas</p>
            <p className="text-3xl" style={{ color: COLORS.green.primary, fontWeight: 700 }}>{totalArea.toFixed(1)}</p>
          </div>
        </div>

        {/* Lista de parcelas */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.green.primary }}></div>
          </div>
        ) : (
          <div className="space-y-3">
            {parcels.map((parcel) => (
              <div key={parcel.id} className="p-4 rounded-2xl flex items-center justify-between" style={{ backgroundColor: COLORS.gray.pale, border: `1px solid ${COLORS.gray.light}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                    <Sprout size={24} color={COLORS.green.primary} />
                  </div>
                  <div>
                    <p style={{ color: COLORS.gray.dark, fontWeight: 700 }}>{parcel.name}</p>
                    <p className="text-sm" style={{ color: COLORS.gray.medium }}>{parcel.area} ha • {parcel.cropType}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                   <button 
                     onClick={() => handleOpenEdit(parcel)}
                     className="p-2 bg-white rounded-lg shadow-sm active:scale-95 transition-transform"
                   >
                      <Edit size={16} color={COLORS.blue.primary} />
                   </button>
                   <button 
                     onClick={() => handleDelete(parcel.id)}
                     className="p-2 bg-white rounded-lg shadow-sm active:scale-95 transition-transform"
                   >
                      <Trash2 size={16} color={COLORS.red.primary} />
                   </button>
                </div>
              </div>
            ))}
            {parcels.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                <p>No tienes parcelas registradas</p>
              </div>
            )}
          </div>
        )}

        {/* Botón nueva parcela */}
        <button onClick={handleOpenCreate} className="w-full mt-6 p-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ backgroundColor: COLORS.green.primary, color: COLORS.white, fontWeight: 700 }}>
          <Plus size={20} strokeWidth={2.5} />
          <span>Nueva Parcela</span>
        </button>
      </div>

      {/* Modal Nueva/Editar Parcela */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: COLORS.gray.dark }}>
                {editingParcel ? 'Editar Parcela' : 'Nueva Parcela'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Nombre de la Parcela</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Banano Norte" 
                  className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:outline-none transition-all text-gray-900 font-medium" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Área (ha)</label>
                  <input 
                    type="number" 
                    required
                    step="0.1"
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                    placeholder="0.0" 
                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:outline-none transition-all text-gray-900 font-medium" 
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Cultivo Principal</label>
                  <select 
                    value={formData.cropType}
                    onChange={e => setFormData({...formData, cropType: e.target.value})}
                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:outline-none transition-all text-gray-900 font-medium"
                  >
                    <option value="Banano">Banano</option>
                    <option value="Yuca">Yuca</option>
                    <option value="Plátano">Plátano</option>
                    <option value="Maíz">Maíz</option>
                    <option value="Otro">Otro...</option>
                  </select>
                </div>
              </div>

              {formData.cropType === "Otro" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">Especificar Cultivo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.otherCrop}
                    onChange={e => setFormData({...formData, otherCrop: e.target.value})}
                    placeholder="¿Qué cultivo es?" 
                    className="w-full p-4 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-green-500 focus:outline-none transition-all text-gray-900 font-medium" 
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 p-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ backgroundColor: COLORS.green.primary }}>
                  <CheckCircle size={20} />
                  <span>{editingParcel ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
