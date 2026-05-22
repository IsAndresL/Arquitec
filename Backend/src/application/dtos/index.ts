import { z } from 'zod'

export const loginTechnicianSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export const loginFarmerSchema = z.object({
  farmerId: z.string().min(1, 'El nombre o identificador es obligatorio'),
  pin: z.string().length(4, 'El PIN debe tener 4 dígitos').regex(/^\d+$/, 'El PIN solo debe contener números'),
})

export const createFarmerSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  photoUrl: z.string().optional(),
  municipality: z.string().optional(),
  vereda: z.string().optional(),
  pin: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().length(4, 'El PIN debe tener 4 dígitos').regex(/^\d+$/, 'El PIN solo debe contener números').optional()
  ),
})

export const updateFarmerSchema = z.object({
  name: z.string().optional(),
  photoUrl: z.string().optional(),
  municipality: z.string().optional(),
  vereda: z.string().optional(),
  isActive: z.boolean().optional(),
  pin: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : val),
    z.string().length(4, 'El PIN debe tener 4 dígitos').regex(/^\d+$/, 'El PIN solo debe contener números').optional()
  ),
})

export const createParcelSchema = z.object({
  name: z.string().optional(),
  area: z.number().positive('El área debe ser mayor a 0'),
  cropType: z.string().min(1, 'El tipo de cultivo es obligatorio'),
  icon: z.string().optional(),
  farmerId: z.string().uuid(),
})

export const createClimateSchema = z.object({
  date: z.string().min(1, 'La fecha es obligatoria'),
  type: z.enum(['SOL', 'NUBLADO', 'LLUVIA', 'VIENTO']),
  farmerId: z.string().uuid(),
})

export const createObservationSchema = z.object({
  status: z.enum(['SANO', 'HOJAS_AMARILLAS', 'MANCHAS_NEGRAS', 'HOJAS_SECAS', 'OTRA']),
  notes: z.string().optional(),
  farmerId: z.string().uuid(),
  parcelId: z.string().uuid(),
})

export const createInputSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  quantity: z.number().positive(),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  date: z.string().min(1, 'La fecha es obligatoria'),
  cost: z.number().optional(),
  farmerId: z.string().uuid(),
})

export const createAlertSchema = z.object({
  type: z.enum(['RIEGO', 'REVISAR_CULTIVO', 'OTRO']),
  description: z.string().optional(),
  frequency: z.enum(['DIARIA', 'CADA_N_DIAS', 'SEMANAL']),
  intervalDays: z.number().optional(),
  hour: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)'),
  parcelId: z.string().uuid().optional(),
  farmerId: z.string().uuid(),
})

export const createRecommendationSchema = z.object({
  type: z.enum(['AUTOMATICA', 'MANUAL']),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional(),
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  action: z.string().optional(),
  farmerId: z.string().uuid(),
  observationId: z.string().uuid().optional(),
})

export const updateRecommendationStatusSchema = z.object({
  status: z.enum(['PENDIENTE', 'VISTA', 'SEGUIDA', 'IGNORADA']),
})

export const createRuleSchema = z.object({
  cropType: z.string().min(1),
  cropStatus: z.enum(['SANO', 'HOJAS_AMARILLAS', 'MANCHAS_NEGRAS', 'HOJAS_SECAS', 'OTRA']),
  climateType: z.enum(['SOL', 'NUBLADO', 'LLUVIA', 'VIENTO']).optional(),
  action: z.string().min(1),
  priority: z.enum(['BAJA', 'MEDIA', 'ALTA']).optional(),
})

export const createReportSchema = z.object({
  type: z.string().min(1),
  periodStart: z.string().min(1, 'La fecha de inicio es obligatoria'),
  periodEnd: z.string().min(1, 'La fecha de fin es obligatoria'),
  content: z.string().min(1),
  format: z.enum(['text', 'image']).optional(),
  sharedWith: z.string().optional(),
})

export const syncDataSchema = z.object({
  farmerId: z.string().uuid(),
  entityType: z.string(),
  data: z.array(z.record(z.any())),
})
