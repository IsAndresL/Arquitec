export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Magdalena Smart Farming API',
    version: '1.0.0',
    description: 'Backend API para Magdalena Smart Farming - Sistema de acompañamiento agrícola',
    contact: {
      name: 'Equipo de Desarrollo',
      email: 'dev@magdalena-smart-farming.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de desarrollo',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido al iniciar sesión',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Mensaje de error',
          },
        },
      },
      LoginTechnician: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'tecnico@magdalena-smart-farming.com',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'admin123',
          },
        },
        required: ['email', 'password'],
      },
      LoginFarmer: {
        type: 'object',
        properties: {
          farmerId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
          },
          pin: {
            type: 'string',
            pattern: '^\\d{4}$',
            example: '1234',
          },
        },
        required: ['farmerId', 'pin'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIs...',
          },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string', enum: ['TECNICO_ADMIN', 'CAMPESINO'] },
            },
          },
        },
      },
      Farmer: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Juan Pérez' },
          photoUrl: { type: 'string', nullable: true },
          municipality: { type: 'string', nullable: true },
          vereda: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          isLocked: { type: 'boolean' },
          lastSyncAt: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateFarmer: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Juan Pérez' },
          photoUrl: { type: 'string', nullable: true },
          municipality: { type: 'string', nullable: true },
          vereda: { type: 'string', nullable: true },
        },
        required: ['name'],
      },
      Parcel: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', nullable: true },
          area: { type: 'number', example: 2.5 },
          cropType: { type: 'string', example: 'Yuca' },
          icon: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          farmerId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateParcel: {
        type: 'object',
        properties: {
          name: { type: 'string', nullable: true },
          area: { type: 'number', example: 2.5 },
          cropType: { type: 'string', example: 'Yuca' },
          icon: { type: 'string', nullable: true },
          farmerId: { type: 'string', format: 'uuid' },
        },
        required: ['area', 'cropType', 'farmerId'],
      },
      ClimateRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date-time' },
          type: { type: 'string', enum: ['SOL', 'NUBLADO', 'LLUVIA', 'VIENTO'] },
          farmerId: { type: 'string', format: 'uuid' },
        },
      },
      Observation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          status: {
            type: 'string',
            enum: ['SANO', 'HOJAS_AMARILLAS', 'MANCHAS_NEGRAS', 'HOJAS_SECAS', 'OTRA'],
          },
          notes: { type: 'string', nullable: true },
          farmerId: { type: 'string', format: 'uuid' },
          parcelId: { type: 'string', format: 'uuid' },
        },
      },
      InputRecord: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
          cost: { type: 'number', nullable: true },
          farmerId: { type: 'string', format: 'uuid' },
        },
      },
      Alert: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['RIEGO', 'REVISAR_CULTIVO', 'OTRO'] },
          description: { type: 'string', nullable: true },
          frequency: { type: 'string', enum: ['DIARIA', 'CADA_N_DIAS', 'SEMANAL'] },
          intervalDays: { type: 'integer', nullable: true },
          hour: { type: 'string', example: '06:00' },
          isActive: { type: 'boolean' },
          farmerId: { type: 'string', format: 'uuid' },
          parcelId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      Recommendation: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['AUTOMATICA', 'MANUAL'] },
          priority: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'] },
          status: { type: 'string', enum: ['PENDIENTE', 'VISTA', 'SEGUIDA', 'IGNORADA'] },
          title: { type: 'string' },
          description: { type: 'string' },
          action: { type: 'string', nullable: true },
          farmerId: { type: 'string', format: 'uuid' },
          observationId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      AgronomicRule: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          cropType: { type: 'string' },
          cropStatus: {
            type: 'string',
            enum: ['SANO', 'HOJAS_AMARILLAS', 'MANCHAS_NEGRAS', 'HOJAS_SECAS', 'OTRA'],
          },
          climateType: {
            type: 'string',
            enum: ['SOL', 'NUBLADO', 'LLUVIA', 'VIENTO'],
            nullable: true,
          },
          action: { type: 'string' },
          priority: { type: 'string', enum: ['BAJA', 'MEDIA', 'ALTA'] },
          isActive: { type: 'boolean' },
        },
      },
      DashboardMetrics: {
        type: 'object',
        properties: {
          metrics: {
            type: 'object',
            properties: {
              totalFarmers: { type: 'integer' },
              activeAlerts: { type: 'integer' },
              syncPercentage: { type: 'integer' },
              pendingSyncs: { type: 'integer' },
            },
          },
          recentActivities: { type: 'array' },
          recentRecommendations: { type: 'array' },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          type: { type: 'string' },
          periodStart: { type: 'string', format: 'date-time' },
          periodEnd: { type: 'string', format: 'date-time' },
          content: { type: 'string' },
          format: { type: 'string', default: 'text' },
          sharedWith: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CreateReport: {
        type: 'object',
        properties: {
          type: { type: 'string' },
          periodStart: { type: 'string', format: 'date-time' },
          periodEnd: { type: 'string', format: 'date-time' },
          content: { type: 'string' },
          format: { type: 'string' },
          sharedWith: { type: 'string' },
        },
        required: ['type', 'periodStart', 'periodEnd', 'content'],
      },
    },
  },
  paths: {
    '/auth/login': {
      post: {
        tags: ['Autenticación'],
        summary: 'Login de técnico',
        description: 'Autenticación para técnicos/administradores con email y contraseña',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginTechnician' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': {
            description: 'Credenciales inválidas',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login/farmer': {
      post: {
        tags: ['Autenticación'],
        summary: 'Login de campesino',
        description: 'Autenticación para campesinos con ID y PIN de 4 dígitos',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginFarmer' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login exitoso',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          '401': {
            description: 'PIN incorrecto',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Autenticación'],
        summary: 'Registro de técnico',
        description: 'Crear nueva cuenta de técnico/administrador',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string' },
                },
                required: ['email', 'password', 'name'],
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Técnico creado exitosamente',
          },
          '409': {
            description: 'Email ya existe',
          },
        },
      },
    },
    '/farmers': {
      get: {
        tags: ['Campesinos'],
        summary: 'Listar campesinos',
        description: 'Obtener lista de campesinos registrados por el técnico',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de campesinos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Farmer' },
                },
              },
            },
          },
          '401': { description: 'No autorizado' },
        },
      },
      post: {
        tags: ['Campesinos'],
        summary: 'Crear campesino',
        description: 'Crear un nuevo perfil de campesino (solo técnico)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateFarmer' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Campesino creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Farmer' },
              },
            },
          },
        },
      },
    },
    '/farmers/{id}': {
      get: {
        tags: ['Campesinos'],
        summary: 'Obtener campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Datos del campesino',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Farmer' },
              },
            },
          },
          '404': { description: 'Campesino no encontrado' },
        },
      },
      patch: {
        tags: ['Campesinos'],
        summary: 'Actualizar campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateFarmer' },
            },
          },
        },
        responses: {
          '200': { description: 'Campesino actualizado' },
        },
      },
      delete: {
        tags: ['Campesinos'],
        summary: 'Eliminar campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Campesino eliminado' },
        },
      },
    },
    '/farmers/{id}/regenerate-pin': {
      post: {
        tags: ['Campesinos'],
        summary: 'Regenerar PIN',
        description: 'Generar nuevo PIN para un campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'PIN regenerado exitosamente' },
        },
      },
    },
    '/farmers/{id}/dashboard': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard del campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos del dashboard' },
        },
      },
    },
    '/parcels': {
      get: {
        tags: ['Parcelas'],
        summary: 'Listar parcelas',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de parcelas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Parcel' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Parcelas'],
        summary: 'Crear parcela',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateParcel' },
            },
          },
        },
        responses: {
          '201': { description: 'Parcela creada' },
        },
      },
    },
    '/parcels/{id}': {
      get: {
        tags: ['Parcelas'],
        summary: 'Obtener parcela',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos de la parcela' },
        },
      },
      patch: {
        tags: ['Parcelas'],
        summary: 'Actualizar parcela',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Parcela actualizada' },
        },
      },
      delete: {
        tags: ['Parcelas'],
        summary: 'Eliminar parcela',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Parcela eliminada' },
        },
      },
    },
    '/climate': {
      get: {
        tags: ['Clima'],
        summary: 'Listar registros climáticos',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de registros climáticos',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ClimateRecord' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Clima'],
        summary: 'Registrar clima',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  date: { type: 'string', format: 'date-time' },
                  type: { type: 'string', enum: ['SOL', 'NUBLADO', 'LLUVIA', 'VIENTO'] },
                  farmerId: { type: 'string', format: 'uuid' },
                },
                required: ['date', 'type', 'farmerId'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registro climático creado' },
        },
      },
    },
    '/climate/{id}': {
      get: {
        tags: ['Clima'],
        summary: 'Obtener registro climático',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos del registro climático' },
        },
      },
      patch: {
        tags: ['Clima'],
        summary: 'Actualizar registro climático',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ClimateRecord' },
            },
          },
        },
        responses: {
          '200': { description: 'Registro climático actualizado' },
        },
      },
      delete: {
        tags: ['Clima'],
        summary: 'Eliminar registro climático',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Registro climático eliminado' },
        },
      },
    },
    '/observations': {
      get: {
        tags: ['Observaciones'],
        summary: 'Listar observaciones',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'parcelId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de observaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Observation' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Observaciones'],
        summary: 'Crear observación',
        description: 'Registra una observación del cultivo. Si el estado no es SANO, genera recomendación automática.',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Observation' },
            },
          },
        },
        responses: {
          '201': { description: 'Observación creada' },
        },
      },
    },
    '/observations/{id}': {
      get: {
        tags: ['Observaciones'],
        summary: 'Obtener observación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos de la observación' },
        },
      },
      patch: {
        tags: ['Observaciones'],
        summary: 'Actualizar observación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Observation' },
            },
          },
        },
        responses: {
          '200': { description: 'Observación actualizada' },
        },
      },
      delete: {
        tags: ['Observaciones'],
        summary: 'Eliminar observación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Observación eliminada' },
        },
      },
    },
    '/inputs': {
      get: {
        tags: ['Insumos'],
        summary: 'Listar insumos',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de insumos y total',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    inputs: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/InputRecord' },
                    },
                    total: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Insumos'],
        summary: 'Registrar insumo',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InputRecord' },
            },
          },
        },
        responses: {
          '201': { description: 'Insumo registrado' },
        },
      },
    },
    '/inputs/{id}': {
      get: {
        tags: ['Insumos'],
        summary: 'Obtener insumo',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos del insumo' },
        },
      },
      patch: {
        tags: ['Insumos'],
        summary: 'Actualizar insumo',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/InputRecord' },
            },
          },
        },
        responses: {
          '200': { description: 'Insumo actualizado' },
        },
      },
      delete: {
        tags: ['Insumos'],
        summary: 'Eliminar insumo',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Insumo eliminado' },
        },
      },
    },
    '/alerts/{id}': {
      get: {
        tags: ['Alertas'],
        summary: 'Obtener alerta',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos de la alerta' },
        },
      },
      patch: {
        tags: ['Alertas'],
        summary: 'Actualizar alerta',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Alert' },
            },
          },
        },
        responses: {
          '200': { description: 'Alerta actualizada' },
        },
      },
      delete: {
        tags: ['Alertas'],
        summary: 'Eliminar alerta',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Alerta eliminada' },
        },
      },
    },
    '/alerts': {
      get: {
        tags: ['Alertas'],
        summary: 'Listar alertas',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de alertas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Alert' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Alertas'],
        summary: 'Crear alerta',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Alert' },
            },
          },
        },
        responses: {
          '201': { description: 'Alerta creada' },
        },
      },
    },
    '/recommendations': {
      get: {
        tags: ['Recomendaciones'],
        summary: 'Listar recomendaciones',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'technicianId',
            in: 'query',
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Lista de recomendaciones',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Recommendation' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Recomendaciones'],
        summary: 'Crear recomendación manual',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Recommendation' },
            },
          },
        },
        responses: {
          '201': { description: 'Recomendación creada' },
        },
      },
    },
    '/recommendations/{id}': {
      get: {
        tags: ['Recomendaciones'],
        summary: 'Obtener recomendación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos de la recomendación' },
        },
      },
      patch: {
        tags: ['Recomendaciones'],
        summary: 'Actualizar recomendación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Recommendation' },
            },
          },
        },
        responses: {
          '200': { description: 'Recomendación actualizada' },
        },
      },
      delete: {
        tags: ['Recomendaciones'],
        summary: 'Eliminar recomendación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Recomendación eliminada' },
        },
      },
    },
    '/recommendations/{id}/status': {
      patch: {
        tags: ['Recomendaciones'],
        summary: 'Actualizar estado de recomendación',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PENDIENTE', 'VISTA', 'SEGUIDA', 'IGNORADA'],
                  },
                },
                required: ['status'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Estado actualizado' },
        },
      },
    },
    '/reports': {
      get: {
        tags: ['Reportes'],
        summary: 'Listar reportes',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de reportes',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Report' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Reportes'],
        summary: 'Crear reporte',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateReport' },
            },
          },
        },
        responses: {
          '201': { description: 'Reporte creado' },
        },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Reportes'],
        summary: 'Obtener reporte',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos del reporte' },
        },
      },
      patch: {
        tags: ['Reportes'],
        summary: 'Actualizar reporte',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateReport' },
            },
          },
        },
        responses: {
          '200': { description: 'Reporte actualizado' },
        },
      },
      delete: {
        tags: ['Reportes'],
        summary: 'Eliminar reporte',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Reporte eliminado' },
        },
      },
    },
    '/rules/{id}': {
      get: {
        tags: ['Reglas Agronómicas'],
        summary: 'Obtener regla',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Datos de la regla' },
        },
      },
      patch: {
        tags: ['Reglas Agronómicas'],
        summary: 'Actualizar regla',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AgronomicRule' },
            },
          },
        },
        responses: {
          '200': { description: 'Regla actualizada' },
        },
      },
      delete: {
        tags: ['Reglas Agronómicas'],
        summary: 'Eliminar regla',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': { description: 'Regla eliminada' },
        },
      },
    },
    '/rules': {
      get: {
        tags: ['Reglas Agronómicas'],
        summary: 'Listar reglas',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista de reglas agronómicas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/AgronomicRule' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Reglas Agronómicas'],
        summary: 'Crear regla',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AgronomicRule' },
            },
          },
        },
        responses: {
          '201': { description: 'Regla creada' },
        },
      },
    },
    '/dashboard/technician': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard del técnico',
        description: 'Métricas y resumen para el panel del técnico',
        security: [{ BearerAuth: [] }],
        responses: {
          '200': {
            description: 'Datos del dashboard',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DashboardMetrics' },
              },
            },
          },
        },
      },
    },
    '/dashboard/farmer': {
      get: {
        tags: ['Dashboard'],
        summary: 'Dashboard del campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'query',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Datos del dashboard del campesino' },
        },
      },
    },
    '/reports/farmer-assessment': {
      post: {
        tags: ['Reportes'],
        summary: 'Generar resumen de asesoría',
        description: 'Genera un reporte automático con los datos de un campesino en un período',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  farmerId: { type: 'string', format: 'uuid' },
                  periodStart: { type: 'string', format: 'date-time' },
                  periodEnd: { type: 'string', format: 'date-time' },
                },
                required: ['farmerId', 'periodStart', 'periodEnd'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Reporte generado' },
        },
      },
    },
    '/sync': {
      post: {
        tags: ['Sincronización'],
        summary: 'Sincronizar datos',
        description: 'Sincroniza datos desde dispositivos móviles',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  farmerId: { type: 'string', format: 'uuid' },
                  entityType: { type: 'string', example: 'FarmParcel' },
                  data: { type: 'array', items: { type: 'object' } },
                },
                required: ['farmerId', 'entityType', 'data'],
              },
            },
          },
        },
        responses: {
          '200': { description: 'Sincronización completada' },
        },
      },
    },
    '/sync/{farmerId}': {
      get: {
        tags: ['Sincronización'],
        summary: 'Estado de sincronización',
        description: 'Obtiene el estado de sincronización de un campesino',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'farmerId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Estado de sincronización' },
        },
      },
    },
  },
}

export type SwaggerConfig = typeof swaggerConfig
