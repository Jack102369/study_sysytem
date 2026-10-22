import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { AuthModule } from '../auth/auth.module'
import { ErrorQuestion } from '../error-questions/error-question.entity'
import { PointsModule } from '../points/points.module'
import { Subject } from '../subjects/subject.entity'
import {
  ErrorQuestionKnowledgeCard,
  KnowledgeCard,
} from './knowledge-card.entity'
import { KnowledgeCardsController } from './knowledge-cards.controller'
import { KnowledgeCardsService } from './knowledge-cards.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KnowledgeCard,
      ErrorQuestionKnowledgeCard,
      ErrorQuestion,
      Subject,
    ]),
    AuthModule,
    AiReferenceModule,
    PointsModule,
  ],
  controllers: [KnowledgeCardsController],
  providers: [KnowledgeCardsService],
  exports: [KnowledgeCardsService],
})
export class KnowledgeCardsModule {}
