"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function ServiceWorkerRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js")
          .then((registration) => {
            console.log("SW registered:", registration.scope);

            // Detectar cuando hay un nuevo SW esperando
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (
                    newWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // Hay una nueva versión disponible
                    console.log("[SW] Nueva versión disponible, recargando...");
                    window.location.reload();
                  }
                });
              }
            });

            // Enviar info de usuario inicial tras registro exitoso
            if (registration.active && user) {
              const token = localStorage.getItem("sf_token");
              registration.active.postMessage({
                type: "SET_USER_INFO",
                token,
                farmerId: user.type === "farmer" ? user.data.id : null,
                role: user.type,
                partnerName: user.type === "farmer" ? "Asesor Técnico" : "Productor"
              });
            }
          })
          .catch((error) => {
            console.log("SW registration failed:", error);
          });
      });
    }
  }, [user]);

  // Sincronizar info de usuario en tiempo de ejecución al cambiar de sesión o login/logout
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      if (user) {
        const token = localStorage.getItem("sf_token");
        navigator.serviceWorker.controller.postMessage({
          type: "SET_USER_INFO",
          token,
          farmerId: user.type === "farmer" ? user.data.id : null,
          role: user.type,
          partnerName: user.type === "farmer" ? "Asesor Técnico" : "Productor"
        });
      } else {
        // Limpiar credenciales al cerrar sesión
        navigator.serviceWorker.controller.postMessage({
          type: "SET_USER_INFO",
          token: null,
          farmerId: null,
          role: null,
          partnerName: null
        });
      }
    }
  }, [user]);

  // Manejador Dinámico de Manifiesto PWA basado en Rol o Parámetros URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      
      let finalRole = roleParam;
      if (!finalRole && user) {
        finalRole = user.type;
      }

      let manifestHref = "/manifest.json";
      if (finalRole === "farmer") {
        manifestHref = "/manifest-farmer.json";
      } else if (finalRole === "technician") {
        manifestHref = "/manifest-technician.json";
      }

      let link: HTMLLinkElement | null = document.querySelector('link[rel="manifest"]');
      if (link) {
        if (link.getAttribute("href") !== manifestHref) {
          link.setAttribute("href", manifestHref);
        }
      } else {
        link = document.createElement("link");
        link.rel = "manifest";
        link.href = manifestHref;
        document.head.appendChild(link);
      }
    }
  }, [user]);

  return null;
}
