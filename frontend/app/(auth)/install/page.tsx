"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Share2, PlusSquare, Smartphone } from "lucide-react";
import { COLORS } from "@/lib/design-system";

export default function InstallPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header Premium */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px] flex-shrink-0 z-10 shadow-sm" style={{ backgroundColor: COLORS.green.primary }}>
        <button onClick={() => router.push("/")} className="p-2 rounded-xl mr-3 bg-white/20 active:scale-95 transition-all">
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-white leading-none">Instalar Aplicación (APK / PWA)</h2>
          <p className="text-[10px] text-green-100 mt-1 font-semibold">Magdalena Smart Farming</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6 max-w-md mx-auto w-full">
        {/* QR Code Card */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <Smartphone size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">Código QR Permanente</h3>
            <p className="text-xs font-bold text-slate-400 mt-1">Escanea para acceder e instalar en tu celular</p>
          </div>

          <div className="relative w-64 h-64 border-4 border-slate-50 rounded-3xl overflow-hidden bg-slate-50 flex items-center justify-center p-2">
            <img 
              src="/Smart_Farming_QR.png" 
              alt="Código QR de Acceso Permanente" 
              className="w-full h-full object-contain"
            />
          </div>

          <p className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full">
            https://arquitec-dusky.vercel.app/
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm space-y-3">
          <h4 className="font-extrabold text-sm text-slate-700 flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>Ventajas del Formato PWA (APK)</span>
          </h4>
          <ul className="text-xs font-bold text-slate-500 space-y-2.5 pl-1">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
              <span>No ocupa espacio físico de almacenamiento en tu teléfono celular.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
              <span>Funciona 100% offline (sin internet) para registros de cultivo y clima.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
              <span>Recibe alertas de riego y mensajes del técnico aun con la app cerrada.</span>
            </li>
          </ul>
        </div>

        {/* Instructions Title */}
        <div className="text-center">
          <h3 className="text-base font-black text-slate-700">Guía de Instalación Manual</h3>
          <p className="text-xs font-bold text-slate-400">Sigue estos sencillos pasos según el sistema operativo</p>
        </div>

        {/* Android Steps */}
        <div className="bg-white p-5.5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-sm">
              A
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Dispositivos Android (Chrome)</h4>
              <p className="text-[10px] text-slate-400 font-bold">Instalar como aplicación nativa</p>
            </div>
          </div>

          <div className="space-y-3.5 pl-1.5 border-l-2 border-emerald-50">
            <div className="relative pl-4 space-y-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
              <p className="text-xs font-black text-slate-700">Escanea el código QR superior</p>
              <p className="text-[10px] font-bold text-slate-400">O ingresa a la dirección web desde el navegador Chrome.</p>
            </div>
            <div className="relative pl-4 space-y-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
              <p className="text-xs font-black text-slate-700">Despliega el menú de opciones</p>
              <p className="text-[10px] font-bold text-slate-400">Presiona el icono de los tres puntos verticales en la esquina superior derecha.</p>
            </div>
            <div className="relative pl-4 space-y-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-[9px] font-black">3</span>
              <p className="text-xs font-black text-slate-700">Instala la aplicación</p>
              <p className="text-[10px] font-bold text-slate-400">Selecciona la opción "Instalar aplicación" o "Agregar a la pantalla principal". ¡Listo!</p>
            </div>
          </div>
        </div>

        {/* iOS / Apple Steps */}
        <div className="bg-white p-5.5 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm">
              I
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Dispositivos iPhone / iOS (Safari)</h4>
              <p className="text-[10px] text-slate-400 font-bold">Agregar a la pantalla de inicio</p>
            </div>
          </div>

          <div className="space-y-3.5 pl-1.5 border-l-2 border-blue-50">
            <div className="relative pl-4 space-y-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">1</span>
              <p className="text-xs font-black text-slate-700">Escanea el código QR superior</p>
              <p className="text-[10px] font-bold text-slate-400">O abre el enlace del navegador oficial Safari.</p>
            </div>
            <div className="relative pl-4 space-y-1 flex flex-col gap-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">2</span>
              <p className="text-xs font-black text-slate-700 flex items-center gap-1">
                <span>Presiona el botón de Compartir</span>
                <Share2 size={13} className="text-blue-600 inline" />
              </p>
              <p className="text-[10px] font-bold text-slate-400">Se encuentra en la barra de navegación inferior del navegador Safari.</p>
            </div>
            <div className="relative pl-4 space-y-1 flex flex-col gap-1">
              <span className="absolute left-[-11px] top-1 w-4.5 h-4.5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-[9px] font-black">3</span>
              <p className="text-xs font-black text-slate-700 flex items-center gap-1">
                <span>Selecciona "Agregar al inicio"</span>
                <PlusSquare size={13} className="text-blue-600 inline" />
              </p>
              <p className="text-[10px] font-bold text-slate-400">Busca y pulsa la opción "Agregar a la pantalla de inicio" en el menú desplegable. ¡Listo!</p>
            </div>
          </div>
        </div>

        {/* Back Button bottom */}
        <button 
          onClick={() => router.push("/")}
          className="w-full py-4.5 rounded-2xl bg-emerald-600 text-white font-black text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          <span>Volver al Acceso</span>
        </button>
      </div>
    </div>
  );
}
