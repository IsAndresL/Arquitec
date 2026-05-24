# Magdalena Smart Farming - Manual de Ingenieria y Guia de Operacion

Este documento constituye la especificacion tecnica maestra, guia de arquitectura y manual de operacion y pruebas para el sistema Magdalena Smart Farming, una plataforma integral diseñada para la gestion agricola en zonas de baja conectividad (offline-first) en el departamento del Magdalena, Colombia.

---

## 1. Vision General del Sistema

Magdalena Smart Farming es una solucion tecnologica orientada al sector rural que permite a los productores agricolas (campesinos) y a los asesores tecnicos colaborar activamente en la mejora y monitoreo de cultivos. La plataforma esta diseñada bajo el enfoque offline-first, garantizando resiliencia operativa de mas de 30 dias sin conexion a internet, un sistema de chat en tiempo real bidireccional, alertas por calendario, geolocalizacion climatica y un motor de reglas de Inteligencia Agronoma (IA) para la emision automatica de alertas y consejos de cultivo.

---

## 2. Arquitectura Global del Proyecto

El sistema se compone de dos modulos principales desplegados de manera desacoplada:

```
[ Frontend: Next.js PWA ]  <--- (REST API, JWT, Polling) --->  [ Backend: Next.js Layered API ]
          |                                                              |
    (IndexedDB)                                                     (Prisma ORM)
          |                                                              |
[ Replica Local: Dexie.js ]                                     [ Base de Datos: PostgreSQL ]
          |                                                              |
[ Service Worker: Background ]                                    [ Cache & Sessions: Redis ]
```

### A. Frontend: Progressive Web App (PWA) e Interfaz Movil Premium
*   **Modulo:** `/frontend`
*   **Tecnologias Core:** Next.js 16 (Turbopack), React 19, TypeScript, Tailwind CSS 4.
*   **Persistencia Local:** Dexie.js como capa sobre IndexedDB, proporcionando una base de datos local robusta con soporte para consultas relacionales.
*   **Service Worker (`public/service-worker.js`):** Gestiona la estrategia de almacenamiento en cache (Network-First para rutas dinamicas, Cache-First para recursos estaticos) y controla las operaciones dinamicas en segundo plano (Background Polling de chat y alertas).
*   **Usabilidad Fisica:** Diseñado en modo claro de alta opacidad y contrastes cromaticos basados en la paleta HSL oficial de la marca (Verde Esmeralda, Purpura Pastel y Ambar) para facilitar la lectura bajo la luz del sol directa en el campo.

### B. Backend: Arquitectura Limpia por Capas (Clean Layered Architecture)
*   **Modulo:** `/Backend`
*   **Tecnologias Core:** Next.js 14, TypeScript, PostgreSQL (Base de datos relacional principal), Redis (Capa de cache y control de sesiones).
*   **Prisma ORM:** Motor de mapeo objeto-relacional para interactuar de forma segura y tipada con la base de datos PostgreSQL.
*   **Estructura de 4 Capas:**
    1.  **Presentation Layer (`src/app/api`):** Manejo de rutas, extraccion de parametros, control de cabeceras CORS y validacion de esquemas de entrada mediante Zod.
    2.  **Application Layer (`src/application`):** Contiene los servicios de negocio de la aplicacion (`FarmerService`, `AlertService`, `ClimateService`, `RuleService`, `SyncService`, etc.) y define la logica de casos de uso y DTOs.
    3.  **Domain Layer (`src/domain`):** Define las entidades del modelo de negocio de Prisma e interfaces de repositorios para garantizar el desacoplamiento de infraestructura.
    4.  **Infrastructure Layer (`src/infrastructure`):** Implementaciones tecnologicas de los repositorios Prisma, configuraciones de conexion y control de cache con Redis.

---

## 3. Motores y Funcionalidades Avanzadas

### A. Sistema de Sincronizacion Eventual Offline-First (`useSync.ts`)
*   **Funcionamiento:** Cuando el campesino registra parcelas, observaciones, insumos o clima en su dispositivo sin conexion, los registros se insertan localmente en Dexie.js con el estado `PENDIENTE`.
*   **Deteccion Activa:** El hook `useSync.ts` monitorea los eventos globales `online` y `offline` de la ventana. Al recuperar conexion, lee secuencialmente las colas de cambios locales pendientes y las envia al servidor en lotes tipados usando la API `/api/sync`.
*   **Retroalimentacion:** El panel del campesino lee reactivamente IndexedDB y muestra una insignia dinamica con el conteo de datos en cola (ej: "3 pendientes") y la marca temporal exacta del ultimo ciclo exitoso.

### B. Motor de Inteligencia Agronoma (IA) y Reglas Predictivas
El sistema cuenta con un motor de reglas experto en el backend que opera de forma autonoma al recibir aportes del campesino:
*   **Filtro de Observaciones:** En `ObservationService.ts`, al crearse una observacion con anomalias (`HOJAS_SECAS`, `MANCHAS_NEGRAS`, `HOJAS_AMARILLAS`, `OTRA`), la IA dispara de inmediato una alerta critica de tipo `REVISAR_CULTIVO` o `RIEGO` detallando las acciones recomendadas (ej: aplicar fungicida preventivo si hay manchas negras).
*   **Filtro de Sequias y Clima Historico:** En `ClimateService.ts`, al guardarse el clima diario, la IA analiza los ultimos 3 registros. Si detecta 3 dias consecutivos sin lluvias (`SOL`, `NUBLADO` o `VIENTO`), inyecta de inmediato una alerta de tipo `RIEGO` para instruir al productor a hidratar el cultivo.
*   **Autocierre de Alertas:** Si existe una alerta de riego activa y la IA detecta que el campesino registra el clima de hoy como `LLUVIA`, resuelve y desactiva de forma automatica e inmediata la alerta de riego, manteniendo limpio el dashboard.

### C. Chat Bidireccional Real-Time con Cola Offline
*   **Bidireccionalidad:** El chat conecta en tiempo real al campesino y al asesor tecnico. El backend (`/api/chat`) almacena el flujo de mensajes estructurado y autenticado bajo un patron Singleton en memoria para garantizar consistencia entre sesiones y dispositivos.
*   **Polling Activo:** La vista de chat realiza consultas en segundo plano cada 3 segundos. Al recibir mensajes nuevos de la contraparte, reproduce un pitido acústico amigable, vibra el celular y dispara la notificacion nativa.
*   **Cola Offline del Chat:** Si el campesino escribe un mensaje de chat estando offline, este se renderiza en pantalla al instante y se encola en `sf_pending_chat_${farmerId}` en local storage. El sistema procesa y vacia la cola hacia el servidor de manera automatica en el instante en el que detecta conexion a internet.

### D. Notificaciones en Segundo Plano Reales (Con la App Cerrada)
*   **Desafio Movil:** Al salir de la aplicacion o bloquear el dispositivo, los navegadores moviles suspenden inmediatamente los procesos de la pagina React.
*   **Solucion con Service Worker:** Diseñamos una sincronizacion de credenciales via `postMessage` en `ServiceWorkerRegistration.tsx`. Al loguearse, el frontend transmite el token JWT cifrado, el ID de campesino y su rol al Service Worker en segundo plano.
*   **Hilo de Fondo Independiente:** El Service Worker mantiene una rutina independiente en segundo plano que consulta la API cada 10 segundos. Si encuentra un mensaje de chat o alerta critica nueva, despierta la notificacion nativa del celular (`self.registration.showNotification`) con vibracion y el logotipo oficial de Smart Farming.
*   **Foco Inteligente:** Al hacer clic en la notificacion nativa, el Service Worker detecta la procedencia del mensaje y te lleva directamente a la pantalla del Chat (`/chat`) o Alertas (`/alerts`).

---

## 4. Instalacion y Puesta en Marcha

### Requisitos Previos
*   Node.js v18 o superior
*   Docker y Docker Compose (opcional, para base de datos local)
*   PostgreSQL y Redis instalados localmente (si no usas Docker)

### Configuracion del Backend

1.  Ingresa al directorio del backend:
    ```bash
    cd Backend
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env` en la raiz de `/Backend` con las siguientes variables:
    ```env
    DATABASE_URL="postgresql://postgres:postgres@localhost:5432/magdalena_sf?schema=public"
    REDIS_URL="redis://localhost:6379"
    JWT_SECRET="tu_clave_secreta_super_segura"
    PORT=3000
    ```
4.  Genera las librerias del cliente Prisma:
    ```bash
    npx prisma generate
    ```
5.  Ejecuta las migraciones de la base de datos para crear las tablas en PostgreSQL:
    ```bash
    npx prisma migrate dev
    ```
6.  Ejecuta el seed para poblar la base de datos con los perfiles iniciales de prueba y reglas basicas:
    ```bash
    npx prisma db seed
    ```
7.  Inicia el servidor de desarrollo:
    ```bash
    npm run dev
    ```

### Configuracion del Frontend

1.  Ingresa al directorio del frontend:
    ```bash
    cd ../frontend
    ```
2.  Instala las dependencias necesarias:
    ```bash
    npm install
    ```
3.  Crea un archivo `.env.local` en la raiz de `/frontend`:
    ```env
    NEXT_PUBLIC_API_URL="http://localhost:3000/api"
    ```
4.  Inicia el servidor de desarrollo en el puerto 3001 (o el configurado):
    ```bash
    npm run dev
    ```

---

## 5. Guia Completa de Pruebas Manuales (Paso a Paso)

### Credenciales de Acceso para Pruebas
*   **Técnico Principal:** `tecnico@magdalena-smart-farming.com` / `admin123`
*   **Campesino ("El Trakki"):** Seleccionar perfil en pantalla inicial y digitar PIN **`1234`**.

---

### Prueba A: Simulacion Offline y Sincronizacion Eventual
1.  Inicia sesion en la computadora o celular como el campesino **"El Trakki"**.
2.  Abre las herramientas de desarrollo del navegador presionando `F12`.
3.  Ve a la pestaña **Network** (Red) y en el menu desplegable de limitacion de velocidad selecciona **Offline**.
4.  Comprobacion Visual:
    *   Aparecera un indicador naranja animado en la cabecera superior que dice `Offline`.
    *   La tarjeta de sincronizacion al final de la pantalla (abajo de Consejos y Guías) cambiara su estado a alerta indicando perdida de conexion.
5.  Registra datos offline:
    *   Entra a **Clima** y registra un dia Soleado.
    *   Entra a **Observar** y registra una observacion en tu parcela.
    *   Entra a **Insumos** y registra un nuevo gasto.
6.  Comprobacion de Cola Local:
    *   Regresa al Dashboard del Campesino y ve al final.
    *   La tarjeta de sincronizacion mostrara la alerta naranja parpadeando: **`3 pendientes`** (los tres registros guardados de forma segura en Dexie.js sin internet).
7.  Restablece conexion:
    *   En la pestaña **Network** del F12, vuelve a seleccionar **No Throttling** (Sin Limitacion).
8.  Comprobacion del Ciclo Automatico:
    *   La aplicacion detectara la conexion al instante.
    *   Se ejecutara la sincronizacion automatica en segundo plano.
    *   Aparecera una notificacion nativa con pitido acustico confirmando el exito de la sincronizacion, y la insignia inferior cambiara a verde: **`Al día`**, indicando la hora exacta del proceso.

---

### Prueba B: Chat Bidireccional Real-Time y Cola Offline
1.  Abre dos navegadores o una ventana normal y otra en modo Incognito.
    *   **Ventana A:** Inicia sesion como el campesino "El Trakki". Ve a la seccion **Chat**.
    *   **Ventana B:** Inicia sesion como Asesor Tecnico. Ve a la ficha de "El Trakki" y presiona **"Hablar con el Campesino"** en la cabecera azul.
2.  Escribe y envia un mensaje desde el Campesino.
3.  En menos de 3 segundos, el mensaje aparecera en la pantalla del Asesor Tecnico en la Ventana B, con una notificacion nativa de escritorio y tono auditivo.
4.  Responde desde el Asesor Tecnico. El mensaje aparecera al instante en la Ventana A con alerta sonora y vibracion en dispositivos moviles.
5.  Prueba el Chat Offline:
    *   Pon la Ventana A (Campesino) en modo **Offline** en F12.
    *   Escribe y envia un mensaje. Se mostrara en la pantalla al instante marcado de forma local.
    *   Regresa a modo **Online** en F12. El chat detectara el cambio, transmitira el mensaje en cola de forma transparente y el Asesor Tecnico lo recibira de inmediato.

---

### Prueba C: Notificaciones con la Aplicacion Cerrada (Segundo Plano)
1.  Otorga permisos de notificaciones de sistema al ingresar a la PWA.
2.  Inicia sesion como campesino "El Trakki" en tu celular (PWA instalada) o pestaña del navegador.
3.  Cierra completamente la aplicacion en el celular (ve al inicio del telefono o bloquealo) o cierra la pestaña/minimiza el navegador de la PWA.
4.  Desde la ventana del Asesor Tecnico (en la computadora), envia un nuevo mensaje en el chat con "El Trakki".
5.  Espera unos segundos. El Service Worker, ejecutandose de forma independiente en segundo plano en el sistema operativo, detectara el mensaje tras su polling de 10 segundos.
6.  Veras aparecer en la pantalla de bloqueo o en la barra superior de tu celular la notificacion nativa: **`Respuesta del Asesor`** con el texto exacto.
7.  Pulsa sobre la notificacion. El sistema abrira la aplicacion y te llevara de manera automatica y directa a la vista de chat (`/chat`) para responder.

---

### Prueba D: Motor de Inteligencia Agronoma (IA)
1.  Inicia sesion como el campesino "El Trakki".
2.  **Prueba de Alertas por Anomalías:**
    *   Ve a **Observar** y registra en una de tus parcelas el estado **Manchas Negras**. Guarda la observacion.
    *   Ve de inmediato al Dashboard o Alertas. La IA habra inyectado una alerta critica de tipo **REVISAR_CULTIVO** con la accion correctiva: *"Manchas negras detectadas. Podría ser un hongo. Aplica fungicida preventivo orgánico."*
3.  **Prueba de Alerta Predictiva de Sequía:**
    *   Ve a **Clima** y registra 3 dias seguidos con clima **Sol** (sin registrar ninguna Lluvia en esos 3 dias).
    *   Regresa al Dashboard. La IA habra detectado la sequia e inyectara una alerta critica de tipo **RIEGO** advirtiendo: *"Se han registrado 3 días consecutivos sin lluvias en tu vereda. Riega tus parcelas para mantener el cultivo hidratado."*
4.  **Prueba de Autocierre por Lluvia:**
    *   Teniendo la alerta anterior activa, ve a **Clima** y registra el clima de hoy como **Lluvia**.
    *   Guarda el registro y regresa al Dashboard. La IA habra detectado la lluvia y desactiva de forma automatica y transparente todas las alertas de riego pendientes para el campesino, dejando su panel en estado limpio **"Todo en orden"**.

---
*Magdalena Smart Farming v1.0.0 - Documentacion Oficial del Departamento de Ingenieria de Sistemas, Universidad del Magdalena.*
