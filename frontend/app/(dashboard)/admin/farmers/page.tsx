"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FarmerProfile } from "@/types";
import { 
  ArrowLeft, 
  Search, 
  X,
  ChevronRight,
  Copy,
  Check,
  User
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function AdminFarmersPage() {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Create state
  const [newFarmer, setNewFarmer] = useState({ name: "", municipality: "", vereda: "", pin: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getFarmers();
        setFarmers(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const handleCreateFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFarmer.name) return;
    setIsSubmitting(true);
    try {
      const payload: any = {
        name: newFarmer.name.trim()
      };
      
      if (newFarmer.municipality.trim()) {
        payload.municipality = newFarmer.municipality.trim();
      }
      if (newFarmer.vereda.trim()) {
        payload.vereda = newFarmer.vereda.trim();
      }
      if (newFarmer.pin && newFarmer.pin.trim()) {
        payload.pin = newFarmer.pin.trim();
      }

      const created = await api.createFarmer(payload);
      setFarmers([...farmers, created]);
      setGeneratedPin(created.pin);
      setNewFarmer({ name: "", municipality: "", vereda: "", pin: "" });
    } catch (err: any) {
      console.error(err);
      alert("Error al crear perfil: " + (err.message || "Error desconocido"));
    }
    setIsSubmitting(false);
  };

  const handleCopyPin = () => {
    if (!generatedPin) return;
    navigator.clipboard.writeText(generatedPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeneratedPin(null);
  };

  const filtered = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.municipality || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.blue.primary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50 pb-24">
      {/* Header azul oficial de Figma */}
      <div className="p-4 flex items-center pt-8 rounded-b-[30px]" style={{ backgroundColor: COLORS.blue.primary }}>
        <Link href="/admin" className="p-2 rounded-xl mr-3 hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Campesinos</h2>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {/* Barra de búsqueda */}
        <div>
          <div className="flex items-center gap-3 p-4 rounded-2xl shadow-sm bg-white border border-gray-100 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar campesino..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent focus:outline-none text-gray-800 font-medium placeholder-gray-400 text-sm" 
            />
          </div>
        </div>

        {/* Lista de campesinos */}
        <div className="space-y-3">
          {filtered.length > 0 ? (
            filtered.map((c) => (
              <Link 
                href={`/admin/farmers/${c.id}`} 
                key={c.id} 
                className="p-4 rounded-2xl flex items-center gap-4 border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 shrink-0 group-hover:bg-blue-100 transition-colors">
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={c.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    c.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 truncate group-hover:text-blue-600 transition-colors">{c.name}</p>
                  <p className="text-xs font-bold text-gray-400 truncate mt-0.5">
                    {c.municipality || "Sin municipio"} · {c.vereda || "Sin vereda"}
                  </p>
                </div>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <User size={24} />
              </div>
              <p className="font-bold text-gray-600">No se encontraron productores</p>
              <p className="text-xs text-gray-400 mt-1">Crea un perfil con el botón de abajo para empezar.</p>
            </div>
          )}
        </div>

        {/* Botón flotante/abajo para Crear Campesino */}
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-md hover:opacity-95 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 mt-6"
          style={{ backgroundColor: COLORS.blue.primary }}
        >
          <span>+ Crear Campesino</span>
        </button>
      </div>

      {/* Modal Crear Campesino (Premium HSL Design) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-all duration-300">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-5 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: COLORS.blue.primary }}>
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>
                {generatedPin ? "¡Perfil Creado!" : "Nuevo Campesino"}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {generatedPin ? (
                /* Pantalla de éxito con el PIN */
                <div className="text-center space-y-5">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-500 animate-bounce">
                    <Check size={32} strokeWidth={3} />
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-black text-gray-800">¡Agricultor registrado!</h4>
                    <p className="text-xs text-gray-400 mt-1">El perfil se creó correctamente en el sistema.</p>
                  </div>

                  {/* Tarjeta del PIN */}
                  <div className="p-5 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 relative overflow-hidden group">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">PIN Único de Acceso</p>
                    <p className="text-3xl font-black text-blue-600 tracking-wider font-mono select-all">
                      {generatedPin}
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed px-2">
                    Comparte este PIN con el productor. Lo necesitará junto a su nombre en la pantalla de inicio para acceder a su panel.
                  </p>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      onClick={handleCopyPin}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                        copied 
                          ? 'bg-green-50 text-green-600 border-green-200' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          <span>¡PIN Copiado con éxito!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copiar Código PIN</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCloseModal}
                      className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-sm hover:opacity-90 transition-all mt-1"
                      style={{ backgroundColor: COLORS.blue.primary }}
                    >
                      Entendido y Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                /* Formulario de creación */
                <form onSubmit={handleCreateFarmer} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Nombre Completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Juan Carlos Pérez"
                      value={newFarmer.name}
                      onChange={(e) => setNewFarmer({ ...newFarmer, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Municipio</label>
                    <input
                      type="text"
                      placeholder="Ej. Santa Marta"
                      value={newFarmer.municipality}
                      onChange={(e) => setNewFarmer({ ...newFarmer, municipality: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Vereda / Localidad</label>
                    <input
                      type="text"
                      placeholder="Ej. Taganga"
                      value={newFarmer.vereda}
                      onChange={(e) => setNewFarmer({ ...newFarmer, vereda: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">PIN de Acceso (4 dígitos, opcional)</label>
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Ej. 1234 (Se autogenera si se deja vacío)"
                      value={newFarmer.pin}
                      onChange={(e) => setNewFarmer({ ...newFarmer, pin: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-xl text-white font-extrabold text-sm shadow-md hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-4"
                    style={{ backgroundColor: COLORS.blue.primary }}
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <span>Registrar Productor</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}