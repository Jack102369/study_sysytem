import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { FeatureFlag } from './feature-flag.entity'

/** 内置功能项：新增模块开关时在此登记，启动时写入缺失行 */
const DEFAULT_FLAGS: Array<{
  flagKey: string
  enabled: boolean
  moduleName: string
  label: string
  description: string
}> = [
  {
    flagKey: 'errors.ocr_fill',
    enabled: true,
    moduleName: '错题',
    label: '识别填入题干/解析',
    description: '仅控制错题编辑页识别按钮与对应 OCR 接口；不影响 AI 参考页',
  },
]

@Injectable()
export class FeatureFlagsService implements OnModuleInit {
  constructor(
    @InjectRepository(FeatureFlag)
    private readonly repo: Repository<FeatureFlag>,
  ) {}

  async onModuleInit() {
    await this.ensureDefaults()
  }

  async ensureDefaults() {
    for (const item of DEFAULT_FLAGS) {
      const exists = await this.repo.findOne({ where: { flagKey: item.flagKey } })
      if (exists) {
        exists.moduleName = item.moduleName
        exists.label = item.label
        exists.description = item.description
        await this.repo.save(exists)
        continue
      }
      await this.repo.save(
        this.repo.create({
          flagKey: item.flagKey,
          enabled: item.enabled,
          moduleName: item.moduleName,
          label: item.label,
          description: item.description,
        }),
      )
    }
  }

  async list() {
    const rows = await this.repo.find({ order: { moduleName: 'ASC', flagKey: 'ASC' } })
    return rows.map((r) => this.toView(r))
  }

  async isEnabled(flagKey: string): Promise<boolean> {
    const row = await this.repo.findOne({ where: { flagKey } })
    if (!row) return false
    return !!row.enabled
  }

  async assertEnabled(flagKey: string, message?: string) {
    const ok = await this.isEnabled(flagKey)
    if (!ok) {
      throw new ForbiddenException(message || '该功能已关闭')
    }
  }

  async setEnabled(flagKey: string, enabled: boolean) {
    const row = await this.repo.findOne({ where: { flagKey } })
    if (!row) throw new NotFoundException('功能项不存在')
    row.enabled = enabled
    const saved = await this.repo.save(row)
    return this.toView(saved)
  }

  private toView(row: FeatureFlag) {
    return {
      flagKey: row.flagKey,
      enabled: !!row.enabled,
      moduleName: row.moduleName,
      label: row.label,
      description: row.description,
      updatedAt: row.updatedAt,
    }
  }
}
