"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Share2, PlusSquare, User, Briefcase } from "lucide-react";
import { COLORS } from "@/lib/design-system";

export default function InstallPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header Premium */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px] flex-shrink-0 z-10 shadow-sm" style={{ backgroundColor: COLORS.green.primary }}>
        <button onClick={() => { window.location.href = "https://arquitec-dusky.vercel.app/"; }} className="p-2 rounded-xl mr-3 bg-white/20 active:scale-95 transition-all">
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white leading-none">Instalación Personalizada de Aplicaciones</h2>
          <p className="text-[10px] text-green-100 mt-1 font-semibold">Magdalena Smart Farming</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        <div className="text-center">
          <h3 className="text-base font-black text-slate-700">Selecciona la Aplicación a Instalar</h3>
          <p className="text-xs font-bold text-slate-400">Instala accesos directos independientes en tu celular</p>
        </div>

        {/* 1. App Campesino (Farmer App) */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
              <User size={30} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Aplicación del Campesino</h3>
              <p className="text-xs font-bold text-slate-400">Para productores agrícolas y fincas</p>
            </div>
          </div>

          {/* Android Installation Helper */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">¿Cómo instalar en el Celular?</h4>
            <div className="space-y-3 pl-1.5 border-l-2 border-emerald-50">
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                <p className="text-xs font-black text-slate-700">Presiona el botón "Ir a Instalar Campesino" al pie</p>
              </div>
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                <p className="text-xs font-black text-slate-700">En Android (Chrome): Opciones (3 puntos) → "Instalar aplicación"</p>
              </div>
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">3</span>
                <p className="text-xs font-black text-slate-700">En iOS (Safari): Compartir <Share2 size={11} className="inline text-emerald-600" /> → "Agregar al inicio" <PlusSquare size={11} className="inline text-emerald-600" /></p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { window.location.href = "/farmer?role=farmer"; }}
            className="w-full py-4 rounded-2xl bg-emerald-600 text-white font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
          >
            <span>Ir a Instalar Campesino</span>
          </button>
        </div>

        {/* 2. App Técnico (Technician App) */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <Briefcase size={30} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Aplicación del Técnico</h3>
              <p className="text-xs font-bold text-slate-400">Para ingenieros y asesores agrícolas</p>
            </div>
          </div>

          {/* Android/iOS Installation Helper */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">¿Cómo instalar en el Celular?</h4>
            <div className="space-y-3 pl-1.5 border-l-2 border-blue-50">
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
                <p className="text-xs font-black text-slate-700">Presiona el botón "Ir a Instalar Técnico" al pie</p>
              </div>
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
                <p className="text-xs font-black text-slate-700">En Android (Chrome): Opciones (3 puntos) → "Instalar aplicación"</p>
              </div>
              <div className="relative pl-4">
                <span className="absolute left-[-11px] top-0.5 w-4 h-4 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">3</span>
                <p className="text-xs font-black text-slate-700">En iOS (Safari): Compartir <Share2 size={11} className="inline text-blue-600" /> → "Agregar al inicio" <PlusSquare size={11} className="inline text-blue-600" /></p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { window.location.href = "/technician?role=technician"; }}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
          >
            <span>Ir a Instalar Técnico</span>
          </button>
        </div>

        {/* Back Button bottom */}
        <button 
          onClick={() => { window.location.href = "https://arquitec-dusky.vercel.app/"; }}
          className="w-full py-4.5 rounded-2xl bg-slate-200 hover:bg-slate-350 text-slate-700 font-black text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          <span>Volver al Acceso</span>
        </button>
      </div>
    </div>
  );
}
