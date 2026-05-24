"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Recommendation } from "@/types";
import { 
  ArrowLeft, 
  Lightbulb,
  CheckCircle,
  Info,
  HelpCircle,
  ChevronRight,
  MessageSquare
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function RecommendationsPage() {
  const { user } = useAuth();
  const farmerId = user?.type === "farmer" ? user.data.id : null;
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!farmerId) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getRecommendations(farmerId);
        setRecommendations(Array.isArray(data) ? data : (data?.data || []));
      } catch (err) {
        console.error("Error loading recommendations:", err);
      }
      setIsLoading(false);
    }
    load();
  }, [farmerId]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.blue.primary }}></div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
      {/* Header Figma Refined */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px]" style={{ backgroundColor: COLORS.blue.primary }}>
        <Link href="/dashboard" className="p-2 rounded-xl mr-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl flex-1" style={{ color: COLORS.white, fontWeight: 700 }}>Consejos Técnicos</h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Banner Informativo */}
        <div className="p-5 rounded-2xl flex items-center gap-3 bg-blue-50/50 border border-blue-100">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-white shadow-sm">
            <Lightbulb size={24} color={COLORS.blue.primary} strokeWidth={2.5} />
          </div>
          <p className="text-xs text-blue-900 leading-tight">
            Sigue estas recomendaciones para mejorar la salud y el rendimiento de tus parcelas.
          </p>
        </div>

        {/* Chat con el Técnico */}
        <Link 
          href="/chat" 
          className="p-5 rounded-3xl flex items-center justify-between bg-white border border-blue-100 hover:scale-[1.01] active:scale-95 transition-all shadow-sm group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
              <MessageSquare size={22} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Chat con el Técnico</p>
              <p className="text-[11px] font-semibold text-gray-400">Resuelve tus dudas en tiempo real</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-400 shrink-0" />
        </Link>


        {recommendations.length === 0 ? (
          <div className="text-center py-24">
             <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Info size={32} className="text-gray-300" />
             </div>
             <p className="text-gray-500 font-bold">Sin novedades</p>
             <p className="text-gray-400 text-sm">Tu técnico aún no ha enviado consejos nuevos</p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.id} className={`p-5 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${rec.status === 'VISTA' ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-blue-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-3">
                 <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-widest ${rec.priority === 'ALTA' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                   Prioridad {rec.priority}
                 </span>
                 <p className="text-[10px] font-bold text-gray-400">
                    {new Date(rec.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                 </p>
              </div>
              <h3 className="font-bold text-gray-800 text-base mb-1">{rec.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{rec.description}</p>
              {rec.action && (
                <div className="p-3 bg-blue-50/30 rounded-xl border border-blue-50 flex items-start gap-3">
                   <div className="mt-0.5 p-1 bg-white rounded-lg shadow-sm">
                      <CheckCircle size={14} className="text-blue-600"/>
                   </div>
                   <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tighter">Acción recomendada</p>
                      <p className="text-xs font-bold text-blue-900">{rec.action}</p>
                   </div>
                </div>
              )}
            </div>
          ))
        )}

        <div className="py-10 text-center">
           <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">Magdalena Smart Farming</p>
        </div>
      </div>
    </div>
  );
}
