import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export class ReportService {
  async create(data: {
    type: string
    periodStart: Date
    periodEnd: Date
    content: string
    format?: string
    sharedWith?: string
    technicianId: string
  }) {
    const report = await prisma.report.create({ data })

    await prisma.activityLog.create({
      data: {
        type: 'REPORT_GENERATED',
        description: `Reporte generado: ${data.type}`,
        entityType: 'Report',
        entityId: report.id,
        userId: data.technicianId,
      },
    })

    return report
  }

  async findByTechnician(technicianId: string) {
    return prisma.report.findMany({
      where: { technicianId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(id: string) {
    const report = await prisma.report.findUnique({ where: { id } })

    if (!report) {
      throw new NotFoundError('Reporte no encontrado')
    }

    return report
  }

  async update(id: string, data: Partial<{
    type: string
    periodStart: Date
    periodEnd: Date
    content: string
    format?: string
    sharedWith?: string
  }>) {
    const report = await prisma.report.findUnique({ where: { id } })

    if (!report) {
      throw new NotFoundError('Reporte no encontrado')
    }

    return prisma.report.update({ where: { id }, data })
  }

  async delete(id: string) {
    const report = await prisma.report.findUnique({ where: { id } })

    if (!report) {
      throw new NotFoundError('Reporte no encontrado')
    }

    await prisma.report.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        type: 'REPORT_DELETED',
        description: `Reporte eliminado: ${report.type}`,
        entityType: 'Report',
        entityId: id,
        userId: report.technicianId,
      },
    })

    return { message: 'Reporte eliminado' }
  }

  async generateFarmerReport(farmerId: string, periodStart: Date, periodEnd: Date, technicianId: string) {
    const farmer = await prisma.farmerProfile.findUnique({
      where: { id: farmerId },
      include: {
        parcels: true,
        observations: {
          where: {
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        },
        climateRecords: {
          where: {
            date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        },
        inputs: {
          where: {
            date: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        },
        recommendations: {
          where: {
            createdAt: {
              gte: periodStart,
              lte: periodEnd,
            },
          },
        },
      },
    })

    if (!farmer) {
      throw new NotFoundError('Campesino no encontrado')
    }

    const totalCost = farmer.inputs.reduce((sum, input) => sum + (input.cost || 0), 0)

    const content = `
=== RESUMEN PARA ASESORÍA ===
Productor: ${farmer.name}
Período: ${format(periodStart, 'dd/MM/yyyy', { locale: es })} - ${format(periodEnd, 'dd/MM/yyyy', { locale: es })}

PARCELAS:
${farmer.parcels.map(p => `- ${p.name || 'Sin nombre'}: ${p.area}ha, ${p.cropType}`).join('\n')}

OBSERVACIONES:
${farmer.observations.map(o => `- ${format(o.createdAt, 'dd/MM/yyyy')}: ${o.status}${o.notes ? ` - ${o.notes}` : ''}`).join('\n')}

CLIMA REGISTRADO:
${farmer.climateRecords.map(c => `- ${format(c.date, 'dd/MM/yyyy')}: ${c.type}`).join('\n')}

INSUMOS:
${farmer.inputs.map(i => `- ${i.name}: ${i.quantity} ${i.unit}${i.cost ? ` - $${i.cost}` : ''}`).join('\n')}
Total insumos: $${totalCost.toFixed(2)}

RECOMENDACIONES:
${farmer.recommendations.map(r => `- ${r.title} (${r.type}): ${r.status}`).join('\n')}

NOTA: Esta es una recomendación automática; la decisión final la toma el agricultor.
`.trim()

    return this.create({
      type: 'RESUMEN_ASESORIA',
      periodStart,
      periodEnd,
      content,
      format: 'text',
      technicianId,
    })
  }
}

export const reportService = new ReportService()
