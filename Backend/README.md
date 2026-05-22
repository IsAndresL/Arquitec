# Magdalena Smart Farming - Backend

Backend con arquitectura de capas para el sistema Magdalena Smart Farming.

## Tecnologías

- **Next.js 14** - Framework backend
- **PostgreSQL** - Base de datos principal
- **Redis** - Caché y sesiones
- **Prisma ORM** - Acceso a datos
- **JWT** - Autenticación con tokens
- **Docker Compose** - Infraestructura containerizada
- **Swagger/OpenAPI** - Documentación interactiva de la API
- **Arquitectura de Capas** - Domain, Application, Infrastructure, Presentation

## Estructura del Proyecto

```
src/
├── app/api/           # API Routes (Presentation Layer)
│   ├── auth/          # Autenticación
│   ├── farmers/       # Gestión de campesinos
│   ├── parcels/       # Parcelas
│   ├── climate/       # Registros climáticos
│   ├── observations/  # Observaciones del cultivo
│   ├── inputs/        # Insumos
│   ├── alerts/        # Alertas
│   ├── recommendations/ # Recomendaciones
│   ├── rules/         # Reglas agronómicas
│   ├── reports/       # Reportes
│   ├── sync/          # Sincronización
│   ├── dashboard/     # Dashboards
│   └── activities/    # Logs de actividades
├── domain/            # Domain Layer
│   ├── entities/      # Entidades del dominio
│   └── repositories/  # Interfaces de repositorios
├── application/       # Application Layer
│   ├── services/      # Servicios de aplicación
│   └── dtos/          # Data Transfer Objects
├── infrastructure/    # Infrastructure Layer
│   ├── repositories/  # Implementaciones de repositorios
│   ├── database/      # Configuración de base de datos
│   └── redis/         # Configuración de Redis
└── shared/            # Utilidades compartidas
    ├── config/        # Configuraciones
    ├── errors/        # Errores personalizados
    ├── middlewares/   # Middlewares
    └── utils/         # Utilidades
```

## Roles del Sistema

- **TECNICO_ADMIN**: Técnico agropecuario con acceso al panel de administración
- **CAMPESINO**: Productor rural que accede con PIN de 4 dígitos

## Requisitos Cumplidos

### Funcionales (RF)
- ✅ RF-01: Registro de parcelas y cultivos
- ✅ RF-02: Captura de datos agronómicos offline
- ✅ RF-03: Sincronización eventual
- ✅ RF-04: Alertas programables por calendario
- ✅ RF-05: Recomendaciones contextuales (automáticas y manuales)
- ✅ RF-06: Entrada de datos climáticos alternativos
- ✅ RF-07: Visualización gráfica simple (dashboards)
- ✅ RF-08: Registro de costos e insumos
- ✅ RF-09: Exportación de resúmenes
- ✅ RF-10: Gestión de perfiles multiusuario + autenticación PIN
- ✅ RF-11: Confirmación de seguimiento de recomendación
- ✅ RF-12: Regeneración de PIN por técnico

### No Funcionales (RNF)
- ✅ RNF-01: Usabilidad (diseño orientado a baja alfabetización)
- ✅ RNF-02: Disponibilidad/Resiliencia (offline-first ≥ 30 días)
- ✅ RNF-03: Rendimiento (< 2 segundos, caché con Redis)
- ✅ RNF-04: Mantenibilidad (reglas agronómicas en JSON)
- ✅ RNF-05: Seguridad (hash de PIN, traza de auditoría)
- ✅ RNF-06: Compatibilidad
- ✅ RNF-07: Escalabilidad (colas de sincronización)
- ✅ RNF-09: Ética (aviso ético en dashboard)

## Instalación y Uso

### Con Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# La API estará disponible en http://localhost:3000
```

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno (copiar .env)
# Editar .env con tus configuraciones

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos de prueba
npx prisma db seed

# Iniciar servidor de desarrollo
npm run dev
```

## Documentación Swagger

La API incluye documentación interactiva con Swagger UI:

- **Swagger UI**: `http://localhost:3000/swagger`
- **OpenAPI Spec JSON**: `http://localhost:3000/api/swagger`

Desde Swagger UI puedes:
- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde el navegador
- Ver los schemas de request/response
- Autenticarte con Bearer token para probar endpoints protegidos

### Usar Swagger UI

1. Primero obtén un token haciendo login en `/api/auth/login`
2. Haz clic en el botón **Authorize** en Swagger UI
3. Ingresa `Bearer <tu_token>`
4. Prueba cualquier endpoint protegido

## Credenciales de Prueba

- **Técnico**: `tecnico@magdalena-smart-farming.com` / `admin123`
- **Campesino PIN**: `1234`

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login técnico (email + password)
- `POST /api/auth/login/farmer` - Login campesino (farmerId + PIN)
- `POST /api/auth/register` - Registro de técnico

### Campesinos
- `GET /api/farmers` - Listar campesinos (técnico)
- `POST /api/farmers` - Crear campesino (técnico)
- `GET /api/farmers/:id` - Ver campesino
- `PATCH /api/farmers/:id` - Actualizar campesino
- `POST /api/farmers/:id/regenerate-pin` - Regenerar PIN
- `GET /api/farmers/:id/dashboard` - Dashboard del campesino

### Parcelas
- `GET /api/parcels?farmerId=` - Listar parcelas
- `POST /api/parcels` - Crear parcela
- `GET /api/parcels/:id` - Ver parcela
- `PATCH /api/parcels/:id` - Actualizar parcela
- `DELETE /api/parcels/:id` - Eliminar parcela

### Clima
- `GET /api/climate?farmerId=` - Listar registros climáticos
- `POST /api/climate` - Crear registro climático

### Observaciones
- `GET /api/observations?farmerId=` - Listar observaciones
- `POST /api/observations` - Crear observación (genera recomendación automática si aplica)

### Insumos
- `GET /api/inputs?farmerId=` - Listar insumos + total
- `POST /api/inputs` - Registrar insumo

### Alertas
- `GET /api/alerts?farmerId=` - Listar alertas
- `POST /api/alerts` - Crear alerta
- `GET /api/alerts/:id` - Ver alerta
- `PATCH /api/alerts/:id` - Actualizar alerta
- `DELETE /api/alerts/:id` - Eliminar alerta
- `POST /api/alerts/:id` - Activar/Desactivar alerta

### Recomendaciones
- `GET /api/recommendations?farmerId=` - Listar recomendaciones del campesino
- `GET /api/recommendations?technicianId=` - Listar recomendaciones del técnico
- `POST /api/recommendations` - Crear recomendación manual (técnico)
- `PATCH /api/recommendations/:id/status` - Actualizar estado de recomendación

### Reglas Agronómicas
- `GET /api/rules` - Listar reglas
- `POST /api/rules` - Crear regla
- `GET /api/rules/:id` - Ver regla
- `PATCH /api/rules/:id` - Actualizar regla
- `DELETE /api/rules/:id` - Eliminar regla

### Reportes
- `GET /api/reports` - Listar reportes
- `POST /api/reports` - Crear reporte
- `POST /api/reports/farmer-assessment` - Generar resumen para asesoría

### Sincronización
- `POST /api/sync` - Sincronizar datos
- `GET /api/sync/:farmerId` - Estado de sincronización

### Dashboards
- `GET /api/dashboard/technician` - Dashboard del técnico
- `GET /api/dashboard/farmer?farmerId=` - Dashboard del campesino

### Actividades
- `GET /api/activities` - Logs de actividades

## Autenticación

Todas las rutas protegidas requieren un header:
```
Authorization: Bearer <token_jwt>
```

## Arquitectura de Capas

1. **Presentation Layer** (`app/api/`): Routes de Next.js, validación de entrada, respuestas HTTP
2. **Application Layer** (`application/`): Servicios con lógica de negocio, DTOs, orquestación
3. **Domain Layer** (`domain/`): Entidades, interfaces de repositorios, lógica de dominio pura
4. **Infrastructure Layer** (`infrastructure/`): Implementaciones de repositorios con Prisma, Redis, JWT

## Autores

- Equipo de desarrollo: Isabel Duran, Daniel Florez, Shania Russo, Cristian Peña, Andrés Luna
- Universidad del Magdalena - Programa de Ingeniería de Sistemas
