import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AiReferenceItem } from './ai-reference-item.entity'
import { AiReferenceController } from './ai-reference.controller'
import { AiReferenceService } from './ai-reference.service'
import { DeepseekClientService } from './deepseek-client.service'
import { OcrClientService } from './ocr-client.service'

@Module({
  imports: [TypeOrmModule.forFeature([AiReferenceItem]), AuthModule],
  controllers: [AiReferenceController],
  providers: [AiReferenceService, OcrClientService, DeepseekClientService],
  exports: [AiReferenceService, OcrClientService, DeepseekClientService],
})
export class AiReferenceModule {}
