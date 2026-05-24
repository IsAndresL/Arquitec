"use client";

import { useState, useEffect, useRef, Suspense, useCallback } from "react";
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

  // Cargar historial persistido localmente inicialmente
  useEffect(() => {
    const key = `sf_chat_history_${farmerId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setMessages(JSON.parse(stored));
    } else {
      // Mensaje de bienvenida del técnico
      const farmerDisplayName = isFarmer ? user?.data?.name : partnerName;
      const welcome: Message = {
        id: "welcome",
        sender: "technician",
        text: `¡Hola, ${farmerDisplayName}! Soy tu asesor técnico de Magdalena Smart Farming. ¿Cómo va tu cultivo hoy? Puedes contarme tus dudas sobre riego, plagas, clima o fertilizantes.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcome]);
      localStorage.setItem(key, JSON.stringify([welcome]));
    }
  }, [farmerId, isFarmer, partnerName, user?.data?.name]);

  // Autodesplazamiento al final de los mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Fetch de mensajes desde el servidor
  const fetchMessages = useCallback(async () => {
    if (!farmerId || farmerId === "default") return;
    try {
      const remoteMessages = await api.getChatMessages(farmerId);
      if (Array.isArray(remoteMessages)) {
        const key = `sf_chat_history_${farmerId}`;
        const currentStored = localStorage.getItem(key);
        const currentMsgs = currentStored ? JSON.parse(currentStored) : [];
        
        // Si hay nuevos mensajes
        if (remoteMessages.length > currentMsgs.length) {
          const lastRemote = remoteMessages[remoteMessages.length - 1];
          const myRole = isFarmer ? "farmer" : "technician";
          
          if (lastRemote.sender !== myRole) {
            // Notificación nativa premium con vibración y tono de audio
            notifications.show(
              isFarmer ? "Respuesta del Asesor" : `Mensaje de ${partnerName}`,
              lastRemote.text
            );
          }
          
          setMessages(remoteMessages);
          localStorage.setItem(key, JSON.stringify(remoteMessages));
        } else if (remoteMessages.length !== currentMsgs.length) {
          setMessages(remoteMessages);
          localStorage.setItem(key, JSON.stringify(remoteMessages));
        }
      }
    } catch (err) {
      console.warn("Fallo al obtener mensajes remotos:", err);
    }
  }, [farmerId, isFarmer, partnerName]);

  // Procesar cola de mensajes pendientes de envío offline
  const processPendingQueue = useCallback(async () => {
    if (!farmerId || farmerId === "default") return;
    const pendingKey = `sf_pending_chat_${farmerId}`;
    const pendingStored = localStorage.getItem(pendingKey);
    if (!pendingStored) return;

    const pendingQueue: Message[] = JSON.parse(pendingStored);
    if (pendingQueue.length === 0) return;

    console.log(`[Chat] Intentando enviar ${pendingQueue.length} mensajes pendientes offline...`);
    const remaining: Message[] = [];

    for (const msg of pendingQueue) {
      try {
        await api.sendChatMessage(farmerId, msg.sender, msg.text);
      } catch (err) {
        console.warn("Error al enviar mensaje pendiente:", err);
        remaining.push(msg);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(pendingKey, JSON.stringify(remaining));
    } else {
      localStorage.removeItem(pendingKey);
      fetchMessages();
    }
  }, [farmerId, fetchMessages]);

  // Polling en segundo plano cada 3 segundos
  useEffect(() => {
    if (!farmerId || farmerId === "default") return;

    processPendingQueue();
    fetchMessages();

    const interval = setInterval(() => {
      processPendingQueue();
      fetchMessages();
    }, 3000);

    return () => clearInterval(interval);
  }, [farmerId, fetchMessages, processPendingQueue]);

  // Evento de conexión para vaciar cola inmediatamente
  useEffect(() => {
    const handleOnline = () => {
      processPendingQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [processPendingQueue]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const myRole = isFarmer ? "farmer" : "technician";
    const text = inputText.trim();

    const myMessage: Message = {
      id: crypto.randomUUID(),
      sender: myRole,
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Agregar de forma local e instantánea para mejor usabilidad visual
    const key = `sf_chat_history_${farmerId}`;
    const stored = localStorage.getItem(key);
    const currentMsgs = stored ? JSON.parse(stored) : [];
    const updated = [...currentMsgs, myMessage];
    setMessages(updated);
    localStorage.setItem(key, JSON.stringify(updated));
    setInputText("");

    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    // Intentar enviar al servidor
    try {
      await api.sendChatMessage(farmerId, myRole, text);
      fetchMessages();
    } catch (err) {
      console.warn("Fallo al transmitir mensaje, guardando en cola offline:", err);
      // Guardar en cola
      const pendingKey = `sf_pending_chat_${farmerId}`;
      const pendingStored = localStorage.getItem(pendingKey);
      const pendingQueue = pendingStored ? JSON.parse(pendingStored) : [];
      pendingQueue.push(myMessage);
      localStorage.setItem(pendingKey, JSON.stringify(pendingQueue));
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
