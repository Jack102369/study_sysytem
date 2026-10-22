import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AiAccessService } from '../auth/ai-access.service'
import { DeepseekClientService } from '../ai-reference/deepseek-client.service'
import { PetChatDto, UpdatePetPrefsDto } from './dto/pet-assistant.dto'
import { PetChatDaily } from './pet-chat-daily.entity'
import {
  isPetSkinId,
  PET_SKIN_META,
  type PetSkinId,
} from './pet-skins'
import { UserPetPref } from './user-pet-pref.entity'

@Injectable()
export class PetAssistantService {
  constructor(
    @InjectRepository(UserPetPref)
    private readonly prefsRepo: Repository<UserPetPref>,
    @InjectRepository(PetChatDaily)
    private readonly dailyRepo: Repository<PetChatDaily>,
    private readonly aiAccess: AiAccessService,
    private readonly deepseek: DeepseekClientService,
    private readonly config: ConfigService,
  ) {}

  async getPrefs(userId: string) {
    const row = await this.getOrCreatePrefs(userId)
    return this.toPrefsView(row)
  }

  async updatePrefs(userId: string, dto: UpdatePetPrefsDto) {
    const row = await this.getOrCreatePrefs(userId)
    if (dto.skinId !== undefined) {
      if (!isPetSkinId(dto.skinId)) {
        throw new BadRequestException('无效的形象')
      }
      row.skinId = dto.skinId
    }
    if (dto.petEnabled !== undefined) {
      row.petEnabled = !!dto.petEnabled
    }
    if (dto.wakeWordOverrides !== undefined) {
      row.wakeWordOverrides = this.sanitizeOverrides(dto.wakeWordOverrides)
    }
    await this.prefsRepo.save(row)
    return this.toPrefsView(row)
  }

  async chat(userId: string, dto: PetChatDto) {
    await this.aiAccess.assertCanUseAi(userId)
    await this.assertDailyLimit(userId)

    const prefs = await this.getOrCreatePrefs(userId)
    const skinId: PetSkinId = isPetSkinId(dto.skinId || '')
      ? (dto.skinId as PetSkinId)
      : isPetSkinId(prefs.skinId)
        ? prefs.skinId
        : 'robin'
    const meta = PET_SKIN_META[skinId]
    const history = (dto.history || [])
      .filter((m) => m.content?.trim())
      .slice(-10)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.trim().slice(0, 2000),
      }))

    const { reply, model } = await this.deepseek.petChat({
      skinName: meta.name,
      personality: meta.personality,
      message: dto.message.trim().slice(0, 1000),
      history,
      context: dto.context?.trim().slice(0, 500) || undefined,
    })

    await this.bumpDaily(userId)
    return { reply, model, skinId }
  }

  private async getOrCreatePrefs(userId: string) {
    let row = await this.prefsRepo.findOne({ where: { userId } })
    if (row) return row
    row = this.prefsRepo.create({
      userId,
      skinId: 'robin',
      petEnabled: true,
      wakeWordOverrides: null,
    })
    return this.prefsRepo.save(row)
  }

  private toPrefsView(row: UserPetPref) {
    return {
      userId: row.userId,
      skinId: isPetSkinId(row.skinId) ? row.skinId : 'robin',
      petEnabled: !!row.petEnabled,
      wakeWordOverrides: row.wakeWordOverrides || {},
      updatedAt: row.updatedAt,
    }
  }

  private sanitizeOverrides(raw: Record<string, string>) {
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(raw || {})) {
      if (!isPetSkinId(k)) continue
      const word = String(v || '')
        .trim()
        .slice(0, 32)
      if (word) out[k] = word
    }
    return Object.keys(out).length ? out : null
  }

  private today() {
    return new Date().toISOString().slice(0, 10)
  }

  private async assertDailyLimit(userId: string) {
    const limit = Number(this.config.get<string>('PET_CHAT_DAILY_LIMIT', '40'))
    if (!limit || limit <= 0) return
    const dayDate = this.today()
    const row = await this.dailyRepo.findOne({ where: { userId, dayDate } })
    const c = row?.chatCount || 0
    if (c >= limit) {
      throw new BadRequestException(
        `今日宠物对话已达上限（${limit} 次），请明日再试`,
      )
    }
  }

  private async bumpDaily(userId: string) {
    const dayDate = this.today()
    const row = await this.dailyRepo.findOne({ where: { userId, dayDate } })
    if (row) {
      row.chatCount = (row.chatCount || 0) + 1
      await this.dailyRepo.save(row)
      return
    }
    await this.dailyRepo.save(
      this.dailyRepo.create({ userId, dayDate, chatCount: 1 }),
    )
  }
}
