"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { FarmerProfile } from "@/types";
import { 
  ArrowLeft, 
  Send,
  ChevronRight
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function AdminRecommendationsPage() {
  const [farmers, setFarmers] = useState<FarmerProfile[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [isLoading, setIsLoading] = useState(false);

  const sugerencias = [
    'Aplicar riego en las próximas 48 horas. Temperatura elevada detectada.',
    'Revisar posible plaga en hoja. Se recomienda fungicida preventivo.',
    'Momento óptimo para fertilización. Aplicar NPK según dosis recomendada.'
  ];

  useEffect(() => {
    api.getFarmers().then(setFarmers).catch(console.error);
  }, []);

  const handleSend = async () => {
    if (!selectedFarmerId) { alert("Selecciona un productor"); return; }
    if (!description.trim()) { alert("Escribe una recomendación"); return; }
    
    setIsLoading(true);
    try {
      await api.createRecommendation({
        farmerId: selectedFarmerId,
        title: title || "Recomendación Técnica",
        description,
        priority,
        type: 'MANUAL'
      });
      alert("Recomendación enviada con éxito");
      setTitle("");
      setDescription("");
      setSelectedFarmerId("");
    } catch (err) {
      alert("Error al enviar");
    }
    setIsLoading(false);
  };

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header oficial de Figma */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px]" style={{ backgroundColor: COLORS.blue.primary }}>
        <Link href="/admin" className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl flex-1" style={{ color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}>Recomendaciones</h2>
      </div>

      <div className="p-4 space-y-6">
        {/* ENVIAR A (Figma Style) */}
        <div>
          <p className="mb-3 text-xs tracking-wider" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>ENVIAR A</p>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {Array.isArray(farmers) && farmers.length > 0 ? farmers.map((c) => {
              const initials = (c.name || "U").split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              return (
                <button 
                  key={c.id} 
                  onClick={() => setSelectedFarmerId(c.id)}
                  className={`w-full p-3 rounded-xl flex items-center gap-3 border-2 transition-all ${selectedFarmerId === c.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: COLORS.blue.pale }}>
                    <span style={{ color: COLORS.blue.primary, fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: '12px' }}>
                      {initials}
                    </span>
                  </div>
                  <span style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif' }}>{c.name}</span>
                </button>
              );
            }) : (
              <p className="text-xs text-gray-400 italic">Cargando productores o lista vacía...</p>
            )}
          </div>
        </div>

        {/* SUGERENCIAS DEL SISTEMA (Figma Style) */}
        <div>
          <p className="mb-3 text-xs tracking-wider" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>SUGERENCIAS DEL SISTEMA</p>
          <div className="space-y-2">
            {sugerencias.map((s, idx) => (
              <button 
                key={idx} 
                onClick={() => setDescription(s)}
                className="w-full text-left p-3 rounded-xl transition-all hover:bg-green-100" 
                style={{ backgroundColor: COLORS.green.pale, border: `1px solid ${COLORS.green.light}` }}
              >
                <p className="text-sm" style={{ color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif' }}>{s}</p>
              </button>
            ))}
          </div>
        </div>

        {/* MENSAJE PERSONALIZADO (Figma Style) */}
        <div>
          <p className="mb-3 text-xs tracking-wider" style={{ color: COLORS.gray.medium, fontFamily: 'DM Sans, sans-serif' }}>MENSAJE PERSONALIZADO</p>
          <textarea 
            placeholder="Escribe tu recomendación aquí..." 
            rows={4} 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-4 rounded-xl focus:outline-none" 
            style={{ backgroundColor: COLORS.gray.pale, border: `2px solid ${COLORS.gray.light}`, color: COLORS.gray.dark, fontFamily: 'DM Sans, sans-serif', resize: 'none' }}
          ></textarea>
        </div>

        <button 
          onClick={handleSend}
          disabled={isLoading}
          className="w-full p-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50" 
          style={{ backgroundColor: COLORS.green.light, color: COLORS.white, fontFamily: 'DM Sans, sans-serif', fontWeight: 700 }}
        >
          <Send size={20} strokeWidth={2.5} />
          <span>{isLoading ? "Enviando..." : "Enviar recomendación"}</span>
        </button>
      </div>
    </div>
  );
}
