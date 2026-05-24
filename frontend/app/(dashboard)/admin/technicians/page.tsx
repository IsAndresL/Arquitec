"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Trash2, 
  User, 
  Mail,
  ShieldCheck,
  UserX
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import Link from "next/link";

export default function AdminTechniciansPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Redirigir si no es el técnico principal
  useEffect(() => {
    if (user && (user.type !== "technician" || user.data.email !== "tecnico@magdalena-smart-farming.com")) {
      router.replace("/admin");
    }
  }, [user, router]);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getTechnicians();
        setTechnicians(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const handleDeactivate = async (id: string, name: string) => {
    if (isDeletingId) return;
    
    const confirmDeactivate = window.confirm(
      `¿Estás seguro de desactivar la cuenta del técnico ${name}? Esta acción impedirá que el técnico inicie sesión o acceda a la plataforma.`
    );
    if (!confirmDeactivate) return;

    setIsDeletingId(id);
    try {
      await api.deleteTechnician(id);
      setTechnicians(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error(err);
      alert("Error al desactivar el técnico");
    } finally {
      setIsDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.blue.primary }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-gray-50 pb-24">
      {/* Header azul oficial */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px]" style={{ backgroundColor: COLORS.blue.primary }}>
        <Link href="/admin" className="p-2 rounded-xl mr-3 hover:scale-105 active:scale-95 transition-transform" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </Link>
        <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'DM Sans, sans-serif' }}>Gestionar Técnicos</h2>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl flex gap-3 items-start shadow-sm mb-2">
          <ShieldCheck size={20} className="text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-800 leading-relaxed font-semibold">
            Como Técnico Principal, puedes ver las cuentas activas y desactivar a los técnicos secundarios creados. Las cuentas desactivadas no podrán acceder al panel.
          </div>
        </div>

        {/* Lista de técnicos */}
        <div className="space-y-3">
          {technicians.map((tech) => {
            const isMainTech = tech.email === "tecnico@magdalena-smart-farming.com";
            
            return (
              <div 
                key={tech.id} 
                className="p-4 rounded-2xl flex items-center gap-4 border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0 ${
                  isMainTech ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-gray-800 truncate">{tech.name}</p>
                    {isMainTech && (
                      <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-400 truncate mt-0.5 flex items-center gap-1">
                    <Mail size={12} className="text-gray-300" />
                    <span>{tech.email}</span>
                  </p>
                </div>

                {/* Mostrar botón de eliminar sólo para técnicos secundarios */}
                {!isMainTech && (
                  <button 
                    onClick={() => handleDeactivate(tech.id, tech.name)}
                    disabled={isDeletingId === tech.id}
                    className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 transition-all rounded-xl border border-red-100 shrink-0 flex items-center justify-center disabled:opacity-40"
                  >
                    {isDeletingId === tech.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            );
          })}

          {technicians.length <= 1 && (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <UserX size={24} />
              </div>
              <p className="font-bold text-gray-600">No hay técnicos secundarios</p>
              <p className="text-xs text-gray-400 mt-1">Los técnicos adicionales registrados aparecerán en esta sección.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
