# Arquitectura Técnica - Magdalena Smart Farming (Frontend)

Este documento detalla la estructura, tecnologías y flujos de datos del cliente web de **Magdalena Smart Farming**.

## 🏗️ Arquitectura del Proyecto

El frontend está construido siguiendo un patrón de **arquitectura modular** en Next.js, priorizando la separación de responsabilidades y la resiliencia offline.

### 📂 Estructura de Directorios

- `/app`: Rutas y layouts (Next.js App Router).
  - `/(auth)`: Flujo de autenticación (Login para Técnicos y Campesinos).
  - `/(dashboard)`: Paneles principales de gestión agrícola.
- `/components`: Componentes de UI reutilizables (Navegación, Logos, etc.).
- `/hooks`: Lógica de estado global y efectos (Auth, Sincronización).
- `/lib`: Utilidades core.
  - `api.ts`: Cliente de comunicación con el backend.
  - `db.ts`: Esquema de base de datos local (IndexedDB).
  - `design-system.ts`: Constantes de colores y estilos globales.
- `/public`: Assets estáticos y Service Workers para PWA.

## 🛠️ Stack Tecnológico Detallado

| Tecnología | Propósito |
| :--- | :--- |
| **Next.js 15+** | Framework de React con renderizado híbrido y optimización de rutas. |
| **TypeScript** | Tipado estático para garantizar la integridad de los datos entre Front y Back. |
| **Tailwind CSS 4** | Estilizado rápido basado en utilidades con enfoque en alto contraste. |
| **Dexie.js** | Capa de abstracción sobre **IndexedDB** para almacenamiento robusto en el dispositivo. |
| **Lucide React** | Librería de iconos vectoriales para una interfaz profesional. |
| **Service Workers** | Habilitan la capacidad PWA (Progressive Web App) y caché offline. |

## 📡 Flujo de Comunicación y Datos

### 1. Comunicación con el Backend
La comunicación se centraliza en `lib/api.ts`. Se utiliza `fetch` nativo con interceptores lógicos para:
- Incluir tokens de autenticación (JWT) automáticamente.
- Lanzar excepciones personalizadas (`ApiError`) que contienen el mensaje exacto del servidor.

### 2. Estrategia Offline-First
La aplicación implementa un sistema de persistencia local:
- **Lectura:** Al cargar datos, se consulta primero la API. Si falla, se recurre a los datos almacenados en Dexie.js.
- **Escritura:** Los registros (parcelas, clima, gastos) se guardan inmediatamente en la DB local con un estado `PENDIENTE`.
- **Sincronización:** Un hook de fondo detecta cuando vuelve la conexión (`useSync.ts`) y envía los registros pendientes al backend en orden cronológico.

### 3. Sistema de Autenticación
- **Técnicos:** Autenticación clásica vía Email/Password.
- **Campesinos:** Sistema simplificado mediante selección de perfil y PIN de 4 dígitos.
- **Seguridad:** Los tokens se almacenan en `localStorage` y se validan contra el servidor en cada recarga.

## 🎨 Sistema de Diseño
Se ha implementado un sistema de diseño basado en la marca "Magdalena", forzando un **modo claro permanente** para maximizar la legibilidad bajo la luz del sol (condición común en el campo):
- **Primario:** Verde Esmeralda (`#2D6A4F`) - Naturaleza.
- **Acento:** Ámbar (`#E9A62A`) - Tierra/Clima.
- **Tipografía:** DM Sans para máxima legibilidad en dispositivos móviles.

---
*Magdalena Smart Farming v1.0.0 - Documentación de Ingeniería.*
