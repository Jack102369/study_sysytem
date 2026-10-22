import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Attachment } from './attachment.entity'

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly repo: Repository<Attachment>,
  ) {}

  async createLocal(
    userId: string,
    relativeUrl: string,
    mimeType?: string,
    originalName?: string,
  ) {
    const entity = this.repo.create({
      userId,
      storage: 'local',
      url: relativeUrl,
      mimeType: mimeType ?? null,
      originalName: originalName ?? null,
    })
    const saved = await this.repo.save(entity)
    return {
      id: String(saved.id),
      url: saved.url,
      mimeType: saved.mimeType,
      originalName: saved.originalName,
      storage: saved.storage,
      createdAt: saved.createdAt,
    }
  }
}
