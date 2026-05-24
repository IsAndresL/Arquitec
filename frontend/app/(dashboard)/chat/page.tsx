"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowLeft, 
  Send, 
  User, 
  ShieldCheck,
  MessageSquare
} from "lucide-react";
import { COLORS } from "@/lib/design-system";
import { api } from "@/lib/api";
import { notifications } from "@/lib/notifications";
import { useRouter, useSearchParams } from "next/navigation";

interface Message {
  id: string;
  sender: "farmer" | "technician";
  text: string;
  timestamp: string;
}

function ChatInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const queryFarmerId = searchParams.get("farmerId");
  const isFarmer = user?.type === "farmer";
  
  const farmerId = isFarmer ? user.data.id : (queryFarmerId || "default");
  
  const [partnerName, setPartnerName] = useState(isFarmer ? "Asesor Técnico" : "Productor");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar detalles del campesino si somos técnicos
  useEffect(() => {
    if (!isFarmer && queryFarmerId && queryFarmerId !== "default") {
      api.getFarmer(queryFarmerId)
        .then((f) => {
          if (f && f.name) {
            setPartnerName(f.name);
          }
        })
        .catch(console.error);
    } else if (isFarmer) {
      setPartnerName("Asesor Técnico");
    }
  }, [isFarmer, queryFarmerId]);

  // Cargar historial persistido localmente
  useEffect(() => {
    const key = `sf_chat_history_${farmerId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Mensaje de bienvenida del técnico
      const farmerDisplayName = isFarmer ? user.data.name : partnerName;
      const welcome: Message = {
        id: "welcome",
        sender: "technician",
        text: `¡Hola, ${farmerDisplayName}! Soy tu asesor técnico de Magdalena Smart Farming. ¿Cómo va tu cultivo hoy? Puedes contarme tus dudas sobre riego, plagas, clima o fertilizantes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
      localStorage.setItem(key, JSON.stringify([welcome]));
    }
  }, [farmerId, isFarmer, partnerName]);

  // Autodesplazamiento al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Escuchar cambios de almacenamiento en tiempo real (para el intercambio de pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `sf_chat_history_${farmerId}` && e.newValue) {
        const parsed = JSON.parse(e.newValue);
        setMessages(parsed);
        
        // Disparar notificación si el último mensaje es del compañero
        if (parsed.length > 0) {
          const lastMsg = parsed[parsed.length - 1];
          const myRole = isFarmer ? "farmer" : "technician";
          if (lastMsg.sender !== myRole) {
            notifications.show(
              isFarmer ? "Respuesta del Asesor" : `Mensaje de ${partnerName}`,
              lastMsg.text
            );
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [farmerId, isFarmer, partnerName]);

  const saveHistory = (newMessages: Message[]) => {
    setMessages(newMessages);
    localStorage.setItem(`sf_chat_history_${farmerId}`, JSON.stringify(newMessages));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const myRole = isFarmer ? "farmer" : "technician";

    const myMessage: Message = {
      id: crypto.randomUUID(),
      sender: myRole,
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, myMessage];
    saveHistory(updated);
    setInputText("");

    // Trigger sound and vibration
    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Simular respuesta inteligente del técnico SOLO si es el productor el que escribe
    if (isFarmer) {
      setIsTyping(true);
      setTimeout(() => {
        let replyText = "¡Hola! Estoy revisando tus reportes de cultivo y parcelas. Recuerda registrar tus observaciones de salud y costos para poder brindarte una mejor asesoría técnica.";
        const query = myMessage.text.toLowerCase();

        if (query.includes("plaga") || query.includes("amarill") || query.includes("manch") || query.includes("hongo") || query.includes("enfermo")) {
          replyText = "He detectado tu mensaje sobre posibles plagas o anomalías en las hojas. Te aconsejo revisar el nivel de humedad y aplicar un fungicida preventivo orgánico. Ya he cargado una recomendación técnica en tu panel para que la revises.";
        } else if (query.includes("clima") || query.includes("lluvia") || query.includes("nublado") || query.includes("sol") || query.includes("temperatura")) {
          replyText = "Entendido. Recuerda registrar el clima de hoy en tu sección de 'Clima'. Si se avecinan lluvias fuertes, suspende la fertilización temporalmente para evitar que el agua lave los nutrientes del suelo.";
        } else if (query.includes("riego") || query.includes("agua") || query.includes("seco") || query.includes("seco") || query.includes("sequia")) {
          replyText = "El control de humedad es vital en esta etapa del cultivo. Asegúrate de regar por goteo temprano en la mañana o al final de la tarde para evitar la evaporación rápida del agua.";
        } else if (query.includes("hola") || query.includes("buen") || query.includes("salud")) {
          const farmerName = user?.type === "farmer" ? user.data.name : "Productor";
          replyText = `¡Hola, ${farmerName}! Espero que todo vaya excelente en tu finca. ¿Hay algún aspecto particular del cultivo en el que te pueda ayudar hoy?`;
        } else if (query.includes("gracias") || query.includes("listo") || query.includes("perfecto")) {
          replyText = "¡Con gusto! Estoy aquí para apoyarte. Mantén tus registros al día y no dudes en escribirme si notas algún cambio en tus parcelas.";
        }

        const technicianReply: Message = {
          id: crypto.randomUUID(),
          sender: "technician",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setIsTyping(false);
        saveHistory([...updated, technicianReply]);

        // Disparar alerta nativa
        notifications.show("Respuesta del Asesor", replyText);
      }, 1500);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header Premium de Figma */}
      <div className="p-4 flex items-center pt-10 pb-6 rounded-b-[40px] flex-shrink-0 z-10 shadow-sm" style={{ backgroundColor: COLORS.blue.primary }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl mr-3 bg-white/20 active:scale-95 transition-all">
          <ArrowLeft size={20} color={COLORS.white} strokeWidth={2.5} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <ShieldCheck size={22} color={COLORS.white} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white leading-none">
              {isFarmer ? "Asesor Técnico" : partnerName}
            </h2>
            <p className="text-[10px] text-blue-200 mt-1 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              {isFarmer ? "Soporte Agrícola Activo" : "Productor Conectado"}
            </p>
          </div>
        </div>
      </div>

      {/* Area de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender === (isFarmer ? "farmer" : "technician");
          return (
            <div
              key={msg.id}
              className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-blue-600" />
                </div>
              )}
              <div className={`max-w-[75%] rounded-[24px] p-4 shadow-sm text-sm font-medium leading-relaxed flex flex-col ${
                isMe 
                  ? "bg-emerald-600 text-white rounded-br-none" 
                  : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
              }`}>
                <span>{msg.text}</span>
                <span className={`text-[9px] mt-1.5 self-end ${isMe ? "text-emerald-100" : "text-slate-400"}`}>
                  {msg.timestamp}
                </span>
              </div>
              {isMe && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <User size={16} className="text-emerald-600" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-end gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <ShieldCheck size={16} className="text-blue-600" />
            </div>
            <div className="bg-white text-slate-800 border border-slate-100 rounded-[24px] rounded-bl-none p-4 flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100"></span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Formulario de Entrada */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex-shrink-0 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isFarmer ? "Preguntar al técnico..." : `Responder a ${partnerName}...`}
          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-slate-800 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-3.5 rounded-2xl text-white bg-blue-600 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-blue-600/10"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.blue.primary }} />
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}
