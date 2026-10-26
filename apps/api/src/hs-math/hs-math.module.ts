import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { AuthModule } from '../auth/auth.module'
import { AdminGuard } from '../auth/admin.guard'
import { User } from '../users/user.entity'
import { HsMathAdminKnowledgeController } from './admin/hs-math-admin-knowledge.controller'
import { HsMathAdminKnowledgeService } from './admin/hs-math-admin-knowledge.service'
import { HsMathAdminMethodsController } from './admin/hs-math-admin-methods.controller'
import { HsMathAdminMethodsService } from './admin/hs-math-admin-methods.service'
import { HsMathAdminTaxonomyController } from './admin/hs-math-admin-taxonomy.controller'
import { HsMathAdminTaxonomyService } from './admin/hs-math-admin-taxonomy.service'
import { HsMathAdminTrainItemReviewsService } from './admin/hs-math-admin-train-item-reviews.service'
import { HsMathAdminTrainItemsController } from './admin/hs-math-admin-train-items.controller'
import { HsMathAdminTrainItemsImportService } from './admin/hs-math-admin-train-items-import.service'
import { HsMathAdminTrainItemsService } from './admin/hs-math-admin-train-items.service'
import { HsMathCategory } from './entities/hs-math-category.entity'
import { HsMathKnowledgePoint } from './entities/hs-math-knowledge-point.entity'
import { HsMathMethod } from './entities/hs-math-method.entity'
import { HsMathSpecialty } from './entities/hs-math-specialty.entity'
import { HsMathTrainItem } from './entities/hs-math-train-item.entity'
import { HsMathTrainItemKp } from './entities/hs-math-train-item-kp.entity'
import { HsMathTrainItemMethod } from './entities/hs-math-train-item-method.entity'
import { HsMathTrainItemReview } from './entities/hs-math-train-item-review.entity'
import { HsMathTrainSession } from './entities/hs-math-train-session.entity'
import { HsMathTrainSessionItem } from './entities/hs-math-train-session-item.entity'
import { HsMathTrainSessionItemImage } from './entities/hs-math-train-session-item-image.entity'
import { HsMathDeepseekDaily } from './entities/hs-math-deepseek-daily.entity'
import { HsMathHomeController } from './home/hs-math-home.controller'
import { HsMathKnowledgeController } from './taxonomy/hs-math-knowledge.controller'
import { HsMathKnowledgeService } from './taxonomy/hs-math-knowledge.service'
import { HsMathTaxonomyController } from './taxonomy/hs-math-taxonomy.controller'
import { HsMathTaxonomyService } from './taxonomy/hs-math-taxonomy.service'
import { HsMathAnalyticsService } from './train/hs-math-analytics.service'
import { HsMathHomeService } from './train/hs-math-home.service'
import { HsMathApplicationAiGradeService } from './train/hs-math-application-ai-grade.service'
import { HsMathApplicationImagesService } from './train/hs-math-application-images.service'
import { HsMathDeepseekDailyQuotaService } from './train/hs-math-deepseek-daily-quota.service'
import { HsMathQwenVisionClientService } from './train/hs-math-qwen-vision-client.service'
import { HsMathTrainController } from './train/hs-math-train.controller'
import { HsMathTrainService } from './train/hs-math-train.service'

const HS_MATH_ENTITIES = [
  HsMathSpecialty,
  HsMathCategory,
  HsMathKnowledgePoint,
  HsMathTrainItem,
  HsMathTrainItemKp,
  HsMathTrainItemReview,
  HsMathMethod,
  HsMathTrainItemMethod,
  HsMathTrainSession,
  HsMathTrainSessionItem,
  HsMathTrainSessionItemImage,
  HsMathDeepseekDaily,
]

/**
 * 高一数学模块（P0 训练/学情 + P1-0A 知识点 Entity 注册）。
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([...HS_MATH_ENTITIES, User]),
    AuthModule,
    AiReferenceModule,
  ],
  controllers: [
    HsMathTaxonomyController,
    HsMathKnowledgeController,
    HsMathHomeController,
    HsMathAdminTaxonomyController,
    HsMathAdminKnowledgeController,
    HsMathAdminMethodsController,
    HsMathAdminTrainItemsController,
    HsMathTrainController,
  ],
  providers: [
    HsMathTaxonomyService,
    HsMathKnowledgeService,
    HsMathAdminTaxonomyService,
    HsMathAdminKnowledgeService,
    HsMathAdminMethodsService,
    HsMathAdminTrainItemsService,
    HsMathAdminTrainItemsImportService,
    HsMathAdminTrainItemReviewsService,
    HsMathTrainService,
    HsMathApplicationImagesService,
    HsMathQwenVisionClientService,
    HsMathDeepseekDailyQuotaService,
    HsMathApplicationAiGradeService,
    HsMathAnalyticsService,
    HsMathHomeService,
    AdminGuard,
  ],
  exports: [
    TypeOrmModule,
    HsMathTaxonomyService,
    HsMathKnowledgeService,
    HsMathTrainService,
    HsMathApplicationImagesService,
    HsMathQwenVisionClientService,
    HsMathDeepseekDailyQuotaService,
    HsMathApplicationAiGradeService,
    HsMathAnalyticsService,
  ],
})
export class HsMathModule {}
