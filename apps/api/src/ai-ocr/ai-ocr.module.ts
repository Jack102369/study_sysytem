import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { Attachment } from '../attachments/attachment.entity'
import { AuthModule } from '../auth/auth.module'
import { AiOcrController } from './ai-ocr.controller'
import { AiOcrQwenTextClient } from './ai-ocr-qwen-text.client'
import { AiOcrService } from './ai-ocr.service'
import { AiOcrAnalysis } from './entities/ai-ocr-analysis.entity'
import { AiOcrGrading } from './entities/ai-ocr-grading.entity'
import { AiOcrRecognition } from './entities/ai-ocr-recognition.entity'

/**
 * AI 识题：独立模块（识图 + 解答 + 作答批改），不依赖 ErrorQuestions / HsMath / Points。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiOcrRecognition,
      AiOcrAnalysis,
      AiOcrGrading,
      Attachment,
    ]),
    AuthModule,
    AiReferenceModule,
  ],
  controllers: [AiOcrController],
  providers: [AiOcrService, AiOcrQwenTextClient],
  exports: [AiOcrService],
})
export class AiOcrModule {}
