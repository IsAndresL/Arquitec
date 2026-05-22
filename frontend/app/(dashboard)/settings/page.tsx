"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { 
  LogOut, 
  User, 
  Shield, 
  MapPin, 
  Settings as SettingsIcon,
  ChevronRight,
  Info,
  X,
  Edit2
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const isTechnician = user?.type === "technician";
  // Estado local para mostrar la UI actualizada
  const [data, setData] = useState(user?.data || {} as any);
  
  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
  
  // Form states
  const [editForm, setEditForm] = useState({
    name: data?.name || "",
    municipality: data?.municipality || "",
    vereda: data?.vereda || ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (isTechnician) {
        // Mock actualizacion para técnico (no hay endpoint backend)
        setTimeout(() => {
          setData({ ...data, name: editForm.name });
          setIsSubmitting(false);
          setIsEditModalOpen(false);
          alert("Perfil de técnico actualizado exitosamente");
        }, 500);
      } else {
        // Real actualizacion para campesino
        const updated = await api.updateFarmer(data.id, {
          name: editForm.name
        });
        setData({ ...data, ...updated });
        setIsSubmitting(false);
        setIsEditModalOpen(false);
        alert("Perfil de campesino actualizado correctamente");
      }
    } catch (err) {
      console.error(err);
      alert("Error al actualizar perfil");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full relative overflow-y-auto bg-white" style={{ backgroundColor: COLORS.gray.pale }}>
      {/* Header */}
      <div className="p-8 pb-12 rounded-b-[40px]" style={{ backgroundColor: isTechnician ? COLORS.blue.primary : COLORS.green.primary }}>
        <div className="flex flex-col items-center text-center relative">
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="absolute right-0 top-0 p-3 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
          >
            <Edit2 size={20} />
          </button>
          
          <div className="w-24 h-24 rounded-full bg-white mb-4 flex items-center justify-center shadow-lg border-4 border-white/20">
             {isTechnician ? (
               <Shield size={48} color={COLORS.blue.primary} />
             ) : (
               <User size={48} color={COLORS.green.primary} />
             )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{data?.name || "Usuario"}</h1>
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest">
            {isTechnician ? "Técnico Administrador" : "Productor Agrícola"}
          </p>
        </div>
      </div>

      <div className="p-4 -mt-8 space-y-4">
        {/* Info Card */}
        <div className="rounded-3xl p-6 shadow-sm border bg-white border-gray-100">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Información de Perfil</h3>
             <button onClick={() => setIsEditModalOpen(true)} className="text-xs text-blue-500 font-bold uppercase hover:underline">Editar</button>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400">
                    <User size={20} />
                 </div>
                 <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Nombre Completo</p>
                    <p className="text-sm font-bold text-gray-800">{data?.name}</p>
                 </div>
              </div>

              {!isTechnician && (
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-gray-400">
                      <MapPin size={20} />
                   </div>
                   <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Ubicación</p>
                      <p className="text-sm font-bold text-gray-800">
                        {data?.municipality || "Sin municipio"} • {data?.vereda || "Sin vereda"}
                      </p>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* Acciones */}
        <div className="rounded-3xl p-2 shadow-sm border overflow-hidden bg-white border-gray-100">
           <button 
             onClick={() => setIsPrefModalOpen(true)}
             className="w-full flex items-center p-4 transition-colors group hover:bg-gray-50"
           >
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-3">
                 <SettingsIcon size={20} />
              </div>
              <span className="flex-1 text-left font-bold text-gray-700">Preferencias</span>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-400" />
           </button>

           <div className="h-px mx-4 bg-gray-50"></div>

           <button 
             onClick={handleLogout}
             className="w-full flex items-center p-4 transition-colors group hover:bg-red-50"
           >
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 mr-3">
                 <LogOut size={20} />
              </div>
              <span className="flex-1 text-left font-bold text-red-600">Cerrar Sesión</span>
              <ChevronRight size={18} className="text-red-300 group-hover:text-red-400" />
           </button>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center py-6">
           <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-gray-300" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Magdalena Smart Farming v1.0.0</p>
           </div>
        </div>
      </div>

      {/* MODAL: Editar Perfil */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative bg-white">
            <div className="p-4 border-b flex items-center justify-between border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Editar Perfil</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-gray-700">Nombre completo</label>
                  <input 
                    required
                    type="text" 
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 focus:outline-none focus:border-blue-400 bg-gray-50 border-gray-100 text-gray-900 font-medium"
                  />
                </div>
                {!isTechnician && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 mt-2">
                    <p className="text-xs text-blue-700 italic font-medium">
                      * Nota: El municipio y la vereda solo pueden ser modificados por un Administrador/Técnico.
                    </p>
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                   <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 p-4 rounded-xl font-bold transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200">Cancelar</button>
                   <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-[2] p-4 rounded-xl font-bold text-white transition-transform active:scale-95"
                    style={{ backgroundColor: isTechnician ? COLORS.blue.primary : COLORS.green.primary }}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Preferencias */}
      {isPrefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative bg-white">
            <div className="p-4 border-b flex items-center justify-between border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">Preferencias de App</h3>
              <button onClick={() => setIsPrefModalOpen(false)} className="p-2 rounded-full bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800">Notificaciones</h4>
                  <p className="text-sm text-gray-500">Alertas push y de sistema</p>
                </div>
                <button 
                  className="w-14 h-8 rounded-full p-1 transition-colors bg-blue-500"
                >
                  <div className="w-6 h-6 rounded-full bg-white transform transition-transform translate-x-6"></div>
                </button>
              </div>

              <button 
                onClick={() => setIsPrefModalOpen(false)}
                className="w-full p-4 rounded-xl font-bold text-white mt-4 bg-gray-700 hover:bg-gray-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
