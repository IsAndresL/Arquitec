import { PrismaClient, Role, CropStatus, ClimateType, AlertType, AlertFrequency, RecommendationPriority } from '@prisma/client'
import { hashPassword, hashPIN } from '../src/shared/utils/password'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Crear técnico administrador
  const technician = await prisma.user.create({
    data: {
      email: 'tecnico@magdalena-smart-farming.com',
      password: await hashPassword('admin123'),
      name: 'Técnico Agrícola',
      role: Role.TECNICO_ADMIN,
    },
  })
  console.log('Técnico creado:', technician.email)

  // Crear campesino de ejemplo
  const pin = '1234'
  const pinHash = await hashPIN(pin)

  const farmer = await prisma.farmerProfile.create({
    data: {
      name: 'Juan Pérez',
      photoUrl: 'https://example.com/avatar1.png',
      municipality: 'Santa Marta',
      vereda: 'Taganga',
      pinHash,
      createdById: technician.id,
    },
  })
  console.log('Campesino creado:', farmer.name, '- PIN:', pin)

  // Crear parcelas
  const parcel1 = await prisma.farmParcel.create({
    data: {
      name: 'Parcela Norte',
      area: 2.5,
      cropType: 'Yuca',
      icon: '🌿',
      farmerId: farmer.id,
    },
  })

  const parcel2 = await prisma.farmParcel.create({
    data: {
      name: 'Parcela Sur',
      area: 1.8,
      cropType: 'Plátano',
      icon: '🍌',
      farmerId: farmer.id,
    },
  })
  console.log('Parcelas creadas')

  // Crear registros climáticos
  await prisma.climateRecord.createMany({
    data: [
      { date: new Date(), type: ClimateType.SOL, farmerId: farmer.id },
      { date: new Date(Date.now() - 86400000), type: ClimateType.NUBLADO, farmerId: farmer.id },
      { date: new Date(Date.now() - 172800000), type: ClimateType.LLUVIA, farmerId: farmer.id },
    ],
  })
  console.log('Registros climáticos creados')

  // Crear observaciones
  await prisma.cropObservation.create({
    data: {
      status: CropStatus.SANO,
      notes: 'Cultivo en buen estado',
      farmerId: farmer.id,
      parcelId: parcel1.id,
    },
  })

  await prisma.cropObservation.create({
    data: {
      status: CropStatus.HOJAS_AMARILLAS,
      farmerId: farmer.id,
      parcelId: parcel2.id,
    },
  })
  console.log('Observaciones creadas')

  // Crear insumos
  await prisma.inputRecord.createMany({
    data: [
      { name: 'Fertilizante NPK', quantity: 50, unit: 'kg', date: new Date(), cost: 150000, farmerId: farmer.id },
      { name: 'Pesticida orgánico', quantity: 10, unit: 'L', date: new Date(Date.now() - 86400000), cost: 80000, farmerId: farmer.id },
    ],
  })
  console.log('Insumos creados')

  // Crear alertas
  await prisma.alert.create({
    data: {
      type: AlertType.RIEGO,
      frequency: AlertFrequency.DIARIA,
      hour: '06:00',
      farmerId: farmer.id,
      parcelId: parcel1.id,
    },
  })
  console.log('Alertas creadas')

  // Crear reglas agronómicas
  await prisma.agronomicRule.createMany({
    data: [
      {
        cropType: 'Yuca',
        cropStatus: CropStatus.HOJAS_AMARILLAS,
        climateType: ClimateType.SOL,
        action: 'Revisar humedad del suelo y considerar riego en los próximos 2 días',
        priority: RecommendationPriority.ALTA,
      },
      {
        cropType: 'Plátano',
        cropStatus: CropStatus.MANCHAS_NEGRAS,
        climateType: ClimateType.LLUVIA,
        action: 'Aplicar fungicida preventivo y mejorar drenaje',
        priority: RecommendationPriority.ALTA,
      },
      {
        cropType: 'Yuca',
        cropStatus: CropStatus.SANO,
        action: 'Continuar con el manejo actual. Monitorear regularmente.',
        priority: RecommendationPriority.BAJA,
      },
    ],
  })
  console.log('Reglas agronómicas creadas')

  // Crear recomendación manual
  await prisma.recommendation.create({
    data: {
      type: 'MANUAL',
      title: 'Revisión de suelo',
      description: 'Se recomienda realizar análisis de suelo para verificar niveles de nitrogeno',
      action: 'Contactar al laboratorio de suelos',
      farmerId: farmer.id,
      technicianId: technician.id,
    },
  })
  console.log('Recomendaciones creadas')

  // Crear reporte
  await prisma.report.create({
    data: {
      type: 'RESUMEN_MENSUAL',
      periodStart: new Date(Date.now() - 2592000000),
      periodEnd: new Date(),
      content: 'Resumen de actividades del mes...',
      technicianId: technician.id,
    },
  })
  console.log('Reportes creados')

  console.log('\nSeed completado exitosamente!')
  console.log('\nCredenciales de prueba:')
  console.log('Técnico: tecnico@magdalena-smart-farming.com / admin123')
  console.log('Campesino PIN: 1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
