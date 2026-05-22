"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import { ApiError } from "@/lib/api";
import Link from "next/link";

export default function RegisterTechPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) return setError("El nombre es requerido");
    if (!formData.email.trim()) return setError("El email es requerido");
    if (formData.password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres");
    if (formData.password !== formData.confirmPassword) return setError("Las contraseñas no coinciden");

    setIsLoading(true);
    try {
      await api.registerTechnician({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      alert("Registro exitoso. Ahora puedes iniciar sesión.");
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Error al registrar el técnico");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${COLORS.blue.dark} 0%, ${COLORS.blue.primary} 100%)` }}>
      <style>{`
        .dark-input::placeholder {
          color: rgba(255, 255, 255, 0.65) !important;
          opacity: 1 !important;
        }
        .dark-input:-webkit-autofill,
        .dark-input:-webkit-autofill:hover, 
        .dark-input:-webkit-autofill:focus, 
        .dark-input:-webkit-autofill:active {
          -webkit-text-fill-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s !important;
          box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.1) inset !important;
        }
      `}</style>
      <Link href="/" className="absolute top-6 left-6 z-10 p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <ArrowLeft size={24} color={COLORS.white} strokeWidth={2.5} />
      </Link>

      <div className="h-full flex flex-col justify-center px-8 max-w-md mx-auto overflow-y-auto pt-16 pb-8 no-scrollbar">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)' }}>
            <ShieldCheck size={40} color={COLORS.white} strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl text-center mb-2" style={{ color: COLORS.white, fontWeight: 700 }}>Registro Técnico</h2>
          <p className="text-center" style={{ color: COLORS.blue.pale, fontSize: '15px', fontWeight: 500 }}>Crea una cuenta administrativa</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-[10px] font-bold tracking-widest" style={{ color: COLORS.blue.pale }}>NOMBRE COMPLETO</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} color={COLORS.blue.pale} />
              <input 
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ej. Ing. Carlos Pérez" 
                className="w-full p-4 pl-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white border-2 border-white/20 text-[15px] placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 dark-input" 
              />
            </div>
          </div>

          <div>
            <label className="block mb-1 text-[10px] font-bold tracking-widest" style={{ color: COLORS.blue.pale }}>CORREO ELECTRÓNICO</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} color={COLORS.blue.pale} />
              <input 
                type="email" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                placeholder="email@ejemplo.com" 
                className="w-full p-4 pl-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white border-2 border-white/20 text-[15px] placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 dark-input" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-1 text-[10px] font-bold tracking-widest" style={{ color: COLORS.blue.pale }}>CONTRASEÑA</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} color={COLORS.blue.pale} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Mín. 6 caracteres" 
                  className="w-full p-4 pl-12 pr-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white border-2 border-white/20 text-[15px] placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 dark-input" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  {showPassword ? <EyeOff size={18} color={COLORS.blue.pale} /> : <Eye size={18} color={COLORS.blue.pale} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block mb-1 text-[10px] font-bold tracking-widest" style={{ color: COLORS.blue.pale }}>CONFIRMAR</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2" size={18} color={COLORS.blue.pale} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Repite contraseña" 
                  className="w-full p-4 pl-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white border-2 border-white/20 text-[15px] placeholder:text-white/50 focus:border-white/50 focus:bg-white/15 dark-input" 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold animate-in fade-in zoom-in duration-300">
               <AlertCircle size={16} />
               <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full p-5 rounded-xl transition-all hover:scale-[1.02] mt-4 text-lg disabled:opacity-50" 
            style={{ backgroundColor: COLORS.blue.light, color: COLORS.white, fontWeight: 700, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
          >
            {isLoading ? "Registrando..." : "Crear Cuenta"}
          </button>

          <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            ¿Ya tienes cuenta? <Link href="/" className="underline font-bold text-white">Inicia sesión</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
