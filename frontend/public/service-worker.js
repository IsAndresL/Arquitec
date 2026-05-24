const CACHE_NAME = "smart-farming-v3";
const urlsToCache = [
  "/",
  "/dashboard",
  "/parcels",
  "/crops",
  "/data",
  "/alerts",
  "/costs",
  "/settings",
  "/recommendations",
  "/admin",
  "/admin/farmers",
  "/admin/recommendations",
  "/admin/reports",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // Ignorar peticiones que no sean GET o que vayan a la API
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) {
    return;
  }

  // Para la página raíz y rutas principales, usar network-first
  const isMainRoute = urlsToCache.some(
    (url) =>
      event.request.url.endsWith(url) ||
      event.request.url === self.location.origin + "/"
  );

  if (isMainRoute) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((response) => {
            return response || new Response("Sin conexión", { status: 503 });
          });
        })
    );
  } else {
    // Para el resto, usar cache-first
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============================================================================
// SISTEMA DE NOTIFICACIONES DE SEGUNDO PLANO (BACKGROUND POLLING & ALERTS)
// ============================================================================

// Información de usuario para consultas en segundo plano (polling)
let userInfo = {
  token: null,
  farmerId: null,
  role: null,
  partnerName: "Asesor Técnico",
  lastChatLength: 0,
  lastAlertCount: 0
};

let pollInterval = null;

// Escuchar actualizaciones de usuario desde la aplicación
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_USER_INFO") {
    userInfo.token = event.data.token;
    userInfo.farmerId = event.data.farmerId;
    userInfo.role = event.data.role;
    userInfo.partnerName = event.data.partnerName || "Asesor Técnico";
    
    console.log("[SW] Información de usuario sincronizada en SW:", userInfo);
    
    // Iniciar o reiniciar el ciclo de consultas en segundo plano si tenemos credenciales
    if (userInfo.token && userInfo.farmerId) {
      startBackgroundPolling();
    } else {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }
  }
});

function startBackgroundPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  console.log("[SW] Iniciando polling en segundo plano cada 10 segundos...");
  pollInterval = setInterval(async () => {
    if (!userInfo.token || !userInfo.farmerId) return;

    try {
      // 1. Consultar Nuevos Mensajes de Chat
      const chatUrl = `${self.location.origin}/api/chat?farmerId=${userInfo.farmerId}`;
      const chatRes = await fetch(chatUrl, {
        headers: {
          "Authorization": `Bearer ${userInfo.token}`,
          "Cache-Control": "no-store"
        }
      });

      if (chatRes.ok) {
        const messages = await chatRes.json();
        if (Array.isArray(messages)) {
          // Si es la primera vez que se carga en el SW, registrar la cantidad inicial sin notificar
          if (userInfo.lastChatLength === 0) {
            userInfo.lastChatLength = messages.length;
          } else if (messages.length > userInfo.lastChatLength) {
            // Hay nuevos mensajes
            const lastMsg = messages[messages.length - 1];
            const myRole = userInfo.role;
            
            // Solo notificar si el emisor es la contraparte
            if (lastMsg.sender !== myRole) {
              const notificationTitle = myRole === "farmer" ? "Respuesta del Asesor" : `Mensaje de ${userInfo.partnerName}`;
              
              await self.registration.showNotification(notificationTitle, {
                body: lastMsg.text,
                icon: "/Smart_Farming_Logo.png",
                badge: "/Smart_Farming_Logo.png",
                vibrate: [100, 50, 100],
                tag: "chat-new-msg",
                renotify: true,
                data: {
                  url: "/chat"
                }
              });
            }
            userInfo.lastChatLength = messages.length;
          }
        }
      }

      // 2. Consultar Alertas Activas (solo aplica si el rol es campesino/productor)
      if (userInfo.role === "farmer") {
        const alertUrl = `${self.location.origin}/api/alerts?farmerId=${userInfo.farmerId}`;
        const alertRes = await fetch(alertUrl, {
          headers: {
            "Authorization": `Bearer ${userInfo.token}`,
            "Cache-Control": "no-store"
          }
        });

        if (alertRes.ok) {
          const alerts = await alertRes.json();
          if (Array.isArray(alerts)) {
            const activeAlerts = alerts.filter(a => a.isActive);
            // Si es carga inicial
            if (userInfo.lastAlertCount === 0) {
              userInfo.lastAlertCount = activeAlerts.length;
            } else if (activeAlerts.length > userInfo.lastAlertCount) {
              const latestAlert = activeAlerts[0];
              await self.registration.showNotification("Alerta de Cultivo", {
                body: latestAlert.description || "Tu asesor técnico ha enviado una alerta crítica.",
                icon: "/Smart_Farming_Logo.png",
                badge: "/Smart_Farming_Logo.png",
                vibrate: [200, 100, 200],
                tag: "new-critical-alert",
                renotify: true,
                data: {
                  url: "/alerts"
                }
              });
              userInfo.lastAlertCount = activeAlerts.length;
            } else if (activeAlerts.length < userInfo.lastAlertCount) {
              // Si se resolvieron alertas
              userInfo.lastAlertCount = activeAlerts.length;
            }
          }
        }
      }
    } catch (err) {
      console.warn("[SW Background Polling Error]:", err);
    }
  }, 10000);
}

// Escuchar clics en la notificación para abrir la app en la ruta correcta
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      // Si la app está abierta, enfocarla
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      // De lo contrario, abrir una nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
