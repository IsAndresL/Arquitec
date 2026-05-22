# Magdalena Smart Farming - Frontend

Este es el cliente web de la plataforma **Magdalena Smart Farming**, una aplicación diseñada para la gestión agrícola con un enfoque "Offline-First".

## 🚀 Tecnologías Utilizadas

*   **Framework:** [Next.js 15+](https://nextjs.org/) con App Router y TypeScript.
*   **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/) para un diseño responsivo y moderno.
*   **Iconografía:** [Lucide React](https://lucide.dev/) para iconos vectoriales profesionales.
*   **Base de Datos Local:** [Dexie.js](https://dexie.org/) (wrapper de IndexedDB) para almacenamiento offline.
*   **PWA:** Soporte para Service Workers para funcionamiento sin conexión e instalación como aplicación nativa.

## 📡 Comunicación con el Backend

La aplicación se comunica con el backend a través de una arquitectura de servicios centralizada:

1.  **Capa de API (`lib/api.ts`):** Centraliza todas las peticiones fetch hacia el servidor (Node.js/Express).
2.  **Manejo de Errores:** Utiliza una clase personalizada `ApiError` para capturar y mostrar mensajes claros del servidor (como "PIN incorrecto") directamente en la interfaz.
3.  **Sincronización:** Implementa un sistema que guarda los datos localmente cuando no hay internet y los sincroniza automáticamente con el backend cuando se detecta conexión.

## 🛠️ Ejecución en Desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en [http://localhost:3001](http://localhost:3001).

---
*Magdalena Smart Farming - Transformando el campo con tecnología.*
