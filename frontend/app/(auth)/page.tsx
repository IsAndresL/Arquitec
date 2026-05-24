"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { FarmerProfile } from "@/types";
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  ChevronRight, 
  Package, 
  Delete,
  AlertCircle,
  Smartphone
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginTechnician, loginFarmer } = useAuth();
  const [mode, setMode] = useState<"selection" | "technician" | "farmer">("selection");
  
  // Technician State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [techError, setTechError] = useState("");
  
  // Farmer State
  const [farmersList, setFarmersList] = useState<{ id: string; name: string }[]>([]);
  const [farmerName, setFarmerName] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadFarmers() {
      try {
        const data = await api.getFarmers();
        setFarmersList(data);
      } catch (err) {
        console.error("Error loading farmers:", err);
      }
    }
    loadFarmers();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".autocomplete-container")) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const suggestions = farmerName.trim().length >= 2
    ? farmersList.filter(f => f.name.toLowerCase().includes(farmerName.toLowerCase()))
    : [];

  useEffect(() => {
    if (user) {
      // Ajustamos para que coincida con lo que el dashboard espera
      if (user.type === "technician") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router]);

  const handleTechnicianLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setTechError("");
    
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) { 
      setTechError('Por favor ingresa tu correo'); 
      return; 
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setTechError('El formato de correo es inválido');
      return;
    }

    if (!trimmedPassword) { 
      setTechError('Por favor ingresa tu contraseña'); 
      return; 
    }

    if (trimmedPassword.length < 6) {
      setTechError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await loginTechnician(trimmedEmail, trimmedPassword);
      if (success) {
        setTimeout(() => router.push("/admin"), 100);
      } else {
        setTechError("Credenciales incorrectas");
        setPassword("");
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        setTechError(error.message);
      } else {
        setTechError("Error al iniciar sesión");
      }
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFarmerPinClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);
      setErrorMessage("");
      if (newPin.length === 4) {
        handleFarmerLogin(newPin);
      }
    }
  };

  const handleFarmerLogin = async (finalPin: string) => {
    const name = farmerName.trim();
    if (!name) {
      setErrorMessage("Por favor ingresa tu nombre");
      setPinError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPin('');
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const success = await loginFarmer(name, finalPin);
      if (success) {
        router.push("/dashboard");
      } else {
        setPinError(true);
        setIsShaking(true);
        setErrorMessage("PIN incorrecto");
        setTimeout(() => {
          setIsShaking(false);
        }, 500);
        setTimeout(() => {
          setPin('');
          setPinError(false);
          setErrorMessage('');
        }, 1500);
      }
    } catch (error: any) {
      setPinError(true);
      setIsShaking(true);
      const msg = error.message || "Error de conexión";
      setErrorMessage(msg);
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
      setTimeout(() => {
        setPin('');
        setPinError(false);
        setErrorMessage('');
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  if (mode === "selection") {
    return (
      <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${COLORS.green.primary} 0%, ${COLORS.green.light} 100%)` }}>
        <div className="flex-1 flex flex-col justify-center items-center px-8 relative z-10">
          <div className="mb-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Image 
                src="/Smart_Farming_Logo.png" 
                alt="Magdalena Smart Farming Logo" 
                width={96} 
                height={96} 
                className="object-contain"
                priority
              />
            </div>
            <h1 className="text-5xl mb-3" style={{ color: COLORS.white, fontWeight: 700 }}>Magdalena</h1>
            <p className="tracking-widest" style={{ color: COLORS.green.pale, fontSize: '15px', letterSpacing: '4px', fontWeight: 600 }}>SMART FARMING</p>
          </div>
          <p className="mb-8" style={{ color: COLORS.white, fontSize: '20px', fontWeight: 600 }}>¿Quién eres?</p>
          <div className="w-full max-w-md space-y-4">
            <button onClick={() => setMode('farmer')} className="w-full p-6 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-between" style={{ backgroundColor: COLORS.white, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.green.pale }}>
                  <User size={32} color={COLORS.green.primary} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xl" style={{ color: COLORS.green.primary, fontWeight: 700 }}>Soy Campesino</p>
                  <p className="text-base" style={{ color: COLORS.gray.dark }}>Productor agrícola</p>
                </div>
              </div>
              <ChevronRight size={28} color={COLORS.green.primary} />
            </button>
            <button onClick={() => setMode('technician')} className="w-full p-6 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-between" style={{ backgroundColor: COLORS.white, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)' }}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: COLORS.blue.pale }}>
                  <Package size={32} color={COLORS.blue.primary} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-xl" style={{ color: COLORS.blue.primary, fontWeight: 700 }}>Soy Técnico</p>
                  <p className="text-base" style={{ color: COLORS.gray.dark }}>Administrador del sistema</p>
                </div>
              </div>
              <ChevronRight size={28} color={COLORS.blue.primary} />
            </button>

            <button onClick={() => router.push('/install')} className="w-full p-4 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-between border-2 border-dashed border-white/30 hover:border-white/50 active:scale-[0.98]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)' }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10">
                  <Smartphone size={24} color={COLORS.white} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-base" style={{ color: COLORS.white, fontWeight: 750 }}>Instalar App (PWA / APK)</p>
                  <p className="text-xs" style={{ color: COLORS.green.pale, fontWeight: 600 }}>Descargar en el celular</p>
                </div>
              </div>
              <ChevronRight size={24} color={COLORS.white} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "farmer") {
    return (
      <div className="h-screen relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${COLORS.green.primary} 0%, ${COLORS.green.light} 100%)` }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-6px); }
            40%, 80% { transform: translateX(6px); }
          }
          .animate-shake {
            animation: shake 0.3s ease-in-out;
          }
          .dark-input::placeholder {
            color: rgba(255, 255, 255, 0.65) !important;
            opacity: 1 !important;
          }
        `}</style>
        <button onClick={() => { setMode('selection'); setPin(''); setFarmerName(''); setErrorMessage(''); setPinError(false); }} className="absolute top-6 left-6 z-10 p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
          <ArrowLeft size={24} color={COLORS.white} strokeWidth={2.5} />
        </button>
        <div className="h-full flex flex-col justify-center items-center px-8 max-w-sm mx-auto">
          <div className="mb-6 text-center">
            <h2 className="text-3xl mb-2" style={{ color: COLORS.white, fontWeight: 700 }}>Acceso Campesino</h2>
            <p style={{ color: COLORS.green.pale, fontSize: '16px', fontWeight: 500 }}>Ingresa tus credenciales</p>
          </div>
          
          <div className="autocomplete-container w-full mb-6 relative">
            <label className="block mb-2 text-xs font-bold tracking-wider" style={{ color: COLORS.green.pale }}>NOMBRE DE PRODUCTOR</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2" size={20} color={COLORS.green.pale} />
              <input 
                type="text" 
                value={farmerName} 
                onChange={(e) => { 
                  setFarmerName(e.target.value); 
                  if (errorMessage) setErrorMessage(''); 
                  setShowSuggestions(true);
                }} 
                onFocus={() => setShowSuggestions(true)}
                placeholder="Ej. Juan Carlos Pérez" 
                className="w-full p-4 pl-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white text-[16px] placeholder:text-white/50 focus:bg-white/15 border-2 border-white/20 focus:border-white/50 dark-input"
              />
            </div>
            
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="absolute z-20 w-full mt-2 rounded-xl overflow-hidden backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-200"
                style={{ backgroundColor: 'rgba(10, 45, 30, 0.95)' }}
              >
                {suggestions.slice(0, 5).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFarmerName(f.name);
                      setShowSuggestions(false);
                    }}
                    className="w-full p-4 text-left text-white text-[15px] transition-all hover:bg-white/10 flex items-center gap-3 border-b border-white/5 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS.green.pale, color: COLORS.green.primary }}>
                      {f.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-semibold">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`flex flex-col items-center mb-6 ${isShaking ? "animate-shake" : ""}`}>
            <label className="block mb-2 text-xs font-bold tracking-wider self-start" style={{ color: COLORS.green.pale }}>PIN DE 4 DÍGITOS</label>
            <div className="flex gap-3 mb-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-4 h-4 rounded-full transition-all" style={{ backgroundColor: pin.length > i ? (pinError ? COLORS.red.primary : COLORS.white) : 'rgba(255, 255, 255, 0.3)', transform: pin.length === i ? 'scale(1.2)' : 'scale(1)' }}></div>
              ))}
            </div>
            {errorMessage && (
              <div className="flex items-center gap-1 text-red-100 bg-red-600/30 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                <AlertCircle size={12} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button 
                key={num} 
                onClick={() => handleFarmerPinClick(num.toString())} 
                className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:bg-white/30" 
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
              >
                <span style={{ color: COLORS.white, fontWeight: 700, fontSize: '28px' }}>{num}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleFarmerPinClick('0')} 
              className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:bg-white/30" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
            >
              <span style={{ color: COLORS.white, fontWeight: 700, fontSize: '28px' }}>0</span>
            </button>
            <button 
              onClick={() => { setPin(pin.slice(0, -1)); setPinError(false); setErrorMessage(""); }} 
              className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:bg-white/30" 
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}
            >
              <Delete size={28} color={COLORS.white} strokeWidth={2.5} />
            </button>
          </div>
          <p className="mt-6 text-center" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '13px', fontWeight: 500 }}>¿Olvidaste tu PIN? Consulta a tu técnico</p>
        </div>
      </div>
    );
  }

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
      <button onClick={() => setMode('selection')} className="absolute top-6 left-6 z-10 p-2 rounded-xl transition-all hover:scale-110" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <ArrowLeft size={24} color={COLORS.white} strokeWidth={2.5} />
      </button>
      <div className="h-full flex flex-col justify-center px-8 max-w-md mx-auto">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Image 
              src="/Smart_Farming_Logo.png" 
              alt="Magdalena Smart Farming Logo" 
              width={80} 
              height={80} 
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl text-center mb-2" style={{ color: COLORS.white, fontWeight: 700 }}>Acceso Técnico</h2>
          <p className="text-center" style={{ color: COLORS.blue.pale, fontSize: '16px', fontWeight: 500 }}>Panel de administración</p>
        </div>
        <form onSubmit={handleTechnicianLogin} className="space-y-4">
          <div>
            <label className="block mb-2 text-sm tracking-wider" style={{ color: COLORS.blue.pale, fontWeight: 600 }}>USUARIO</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2" size={20} color={COLORS.blue.pale} />
              <input 
                type="email" 
                value={email} 
                onChange={(e) => { setEmail(e.target.value); if (techError) setTechError(''); }} 
                placeholder="tecnico@gmail.com" 
                className={`w-full p-4 pl-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white text-[16px] placeholder:text-white/50 focus:bg-white/15 border-2 ${techError ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/50'} dark-input`}
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm tracking-wider" style={{ color: COLORS.blue.pale, fontWeight: 600 }}>CONTRASEÑA</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2" size={20} color={COLORS.blue.pale} />
              <input 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); if (techError) setTechError(''); }} 
                placeholder="••••••••" 
                className={`w-full p-4 pl-12 pr-12 rounded-xl focus:outline-none transition-all bg-white/10 text-white text-[16px] placeholder:text-white/50 focus:bg-white/15 border-2 ${techError ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-white/50'} dark-input`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {showPassword ? <EyeOff size={22} color={COLORS.blue.pale} /> : <Eye size={22} color={COLORS.blue.pale} />}
              </button>
            </div>
            {techError && <p className="text-sm mt-1" style={{ color: COLORS.red.light }}>{techError}</p>}
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full p-5 rounded-xl transition-all hover:scale-[1.02] mt-6 text-lg disabled:opacity-50" 
            style={{ backgroundColor: COLORS.blue.light, color: COLORS.white, fontWeight: 700, boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)' }}
          >
            {isLoading ? "Verificando..." : "Iniciar sesión"}
          </button>
          <p className="text-center mt-6" style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '13px' }}>
            ¿No tienes cuenta? <Link href="/register" className="underline font-bold text-white">Regístrate aquí</Link>
          </p>
          <p className="text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>Sesión vinculada al dispositivo</p>
        </form>
      </div>
    </div>
  );
}
