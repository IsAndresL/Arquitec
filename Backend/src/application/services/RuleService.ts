import { promises as fs } from 'fs'
import { join } from 'path'
import { prisma } from '@/shared/config/database'
import { AppError, NotFoundError } from '@/shared/errors/AppError'
import { setCache, getCache, CACHE_TTL } from '@/shared/config/redis'

interface AgronomicRuleJSON {
  id: string
  cropType: string
  cropStatus: 'SANO' | 'HOJAS_AMARILLAS' | 'MANCHAS_NEGRAS' | 'HOJAS_SECAS' | 'OTRA'
  climateType?: 'SOL' | 'NUBLADO' | 'LLUVIA' | 'VIENTO' | null
  action: string
  priority: 'BAJA' | 'MEDIA' | 'ALTA'
  isActive: boolean
}

interface RulesFile {
  version: number
  lastUpdated: string
  description: string
  rules: AgronomicRuleJSON[]
}

const RULES_FILE_PATH = join(process.cwd(), 'agronomic-rules.json')

export class RuleService {
  private rulesCache: AgronomicRuleJSON[] | null = null
  private fileWatcher: any = null

  constructor() {
    // Recargar automáticamente cuando cambie el archivo
    this.watchFile()
  }

  private watchFile() {
    if (process.env.NODE_ENV === 'development') {
      try {
        const { watch } = require('fs')
        this.fileWatcher = watch(RULES_FILE_PATH, (eventType: string) => {
          if (eventType === 'change') {
            console.log('[RuleService] Archivo de reglas modificado, recargando...')
            this.rulesCache = null
            this.invalidateCache()
          }
        })
      } catch {
        // Ignorar errores de watch en entornos donde no esté disponible
      }
    }
  }

  private async loadRulesFromFile(): Promise<AgronomicRuleJSON[]> {
    if (this.rulesCache) {
      return this.rulesCache
    }

    try {
      const content = await fs.readFile(RULES_FILE_PATH, 'utf-8')
      const data: RulesFile = JSON.parse(content)
      this.rulesCache = data.rules || []
      return this.rulesCache
    } catch (error) {
      console.error('[RuleService] Error leyendo archivo de reglas:', error)
      return []
    }
  }

  async create(data: {
    cropType: string
    cropStatus: 'SANO' | 'HOJAS_AMARILLAS' | 'MANCHAS_NEGRAS' | 'HOJAS_SECAS' | 'OTRA'
    climateType?: 'SOL' | 'NUBLADO' | 'LLUVIA' | 'VIENTO'
    action: string
    priority?: 'BAJA' | 'MEDIA' | 'ALTA'
  }) {
    // Crear en archivo JSON
    const rules = await this.loadRulesFromFile()
    const newRule: AgronomicRuleJSON = {
      id: `rule-${Date.now()}`,
      cropType: data.cropType,
      cropStatus: data.cropStatus,
      climateType: data.climateType || null,
      action: data.action,
      priority: data.priority || 'MEDIA',
      isActive: true,
    }

    rules.push(newRule)
    await this.saveRulesToFile(rules)

    // También guardar en BD para compatibilidad
    const rule = await prisma.agronomicRule.create({ data })
    await this.invalidateCache()
    return rule
  }

  private async saveRulesToFile(rules: AgronomicRuleJSON[]) {
    const data: RulesFile = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      description: 'Reglas agronómicas para generación automática de recomendaciones.',
      rules,
    }
    await fs.writeFile(RULES_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8')
    this.rulesCache = rules
  }

  async findAll() {
    const cached = await getCache('agronomic_rules')
    if (cached) {
      return JSON.parse(cached)
    }

    // Prioridad: archivo JSON sobre base de datos
    const fileRules = await this.loadRulesFromFile()
    
    if (fileRules.length > 0) {
      await setCache('agronomic_rules', JSON.stringify(fileRules), CACHE_TTL.RULES)
      return fileRules
    }

    // Fallback a base de datos
    const rules = await prisma.agronomicRule.findMany({
      orderBy: { createdAt: 'desc' },
    })

    await setCache('agronomic_rules', JSON.stringify(rules), CACHE_TTL.RULES)
    return rules
  }

  async findActive() {
    const rules = await this.loadRulesFromFile()
    return rules.filter((r) => r.isActive)
  }

  async findById(id: string) {
    const rules = await this.loadRulesFromFile()
    const rule = rules.find((r) => r.id === id)

    if (rule) {
      return rule
    }

    // Fallback a BD
    const dbRule = await prisma.agronomicRule.findUnique({ where: { id } })
    if (!dbRule) {
      throw new NotFoundError('Regla no encontrada')
    }

    return dbRule
  }

  async update(id: string, data: any) {
    // Actualizar en archivo JSON
    const rules = await this.loadRulesFromFile()
    const index = rules.findIndex((r) => r.id === id)

    if (index >= 0) {
      rules[index] = { ...rules[index], ...data }
      await this.saveRulesToFile(rules)
    }

    // También actualizar en BD
    const dbRule = await prisma.agronomicRule.findUnique({ where: { id } })
    if (dbRule) {
      await prisma.agronomicRule.update({
        where: { id },
        data: { ...data, version: { increment: 1 } },
      })
    }

    await this.invalidateCache()
    return rules[index] || dbRule
  }

  async delete(id: string) {
    // Eliminar de archivo JSON
    const rules = await this.loadRulesFromFile()
    const filtered = rules.filter((r) => r.id !== id)
    
    if (filtered.length !== rules.length) {
      await this.saveRulesToFile(filtered)
    }

    // También eliminar de BD
    const dbRule = await prisma.agronomicRule.findUnique({ where: { id } })
    if (dbRule) {
      await prisma.agronomicRule.delete({ where: { id } })
    }

    await this.invalidateCache()
  }

  async evaluateRules(cropType: string, cropStatus: string, climateType?: string) {
    const rules = await this.loadRulesFromFile()
    
    return rules.filter((rule) => {
      if (!rule.isActive) return false
      if (rule.cropType !== cropType) return false
      if (rule.cropStatus !== cropStatus) return false
      if (rule.climateType && rule.climateType !== climateType) return false
      return true
    })
  }

  async reloadRules(): Promise<{ count: number }> {
    this.rulesCache = null
    await this.invalidateCache()
    const rules = await this.loadRulesFromFile()
    return { count: rules.length }
  }

  private async invalidateCache() {
    await setCache('agronomic_rules', '', 1)
  }
}

export const ruleService = new RuleService()
