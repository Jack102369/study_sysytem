import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AdminGuard } from '../auth/admin.guard'
import { AuthModule } from '../auth/auth.module'
import { User } from '../users/user.entity'
import { ChemCategory } from './chem-category.entity'
import { ChemSpecialty } from './chem-specialty.entity'
import { ChemistryController } from './chemistry.controller'
import { ChemistryService } from './chemistry.service'
import { ChemKbAdminController } from './kb/chem-kb-admin.controller'
import { ChemKbImportService } from './kb/chem-kb-import.service'
import { ChemKbController } from './kb/chem-kb.controller'
import { ChemKbService } from './kb/chem-kb.service'
import { ChemAdvancedTrainController } from './train/chem-advanced-train.controller'
import { ChemAdvancedTrainService } from './train/chem-advanced-train.service'
import { ChemDailyReviewController } from './train/chem-daily-review.controller'
import { ChemDailyReviewService } from './train/chem-daily-review.service'
import { ChemTrainController } from './train/chem-train.controller'
import { ChemTrainEligibilityService } from './train/chem-train-eligibility.service'
import { ChemTrainService } from './train/chem-train.service'
import { ChemAnalyticsController } from './train/chem-analytics.controller'
import { ChemAnalyticsService } from './train/chem-analytics.service'
import { ChemLearningHomeController } from './train/chem-learning-home.controller'
import { ChemLearningHomeService } from './train/chem-learning-home.service'
import { ChemWrongQuestionController } from './train/chem-wrong-question.controller'
import { ChemWrongQuestionService } from './train/chem-wrong-question.service'
import { LocalGeneratorController } from './train/generator/local-generator.controller'
import { LocalGeneratorService } from './train/generator/local-generator.service'
import { TrainItemsAdminController } from './train/generator/train-items-admin.controller'
import { TrainItemsAdminService } from './train/generator/train-items-admin.service'
import { IndustrialReviewController } from './industrial/industrial-review.controller'
import { IndustrialReviewNestService } from './industrial/industrial-review.nest'
import { IndustrialExperimentEnabledGuard } from './industrial/industrial-experiment-enabled.guard'
import { IndustrialFormalImportDbService } from './industrial/industrial-formal-import.db'
import { IndustrialItemAssetQueryService } from './industrial/industrial-item-asset.query'
import { IndustrialWrongVariationService } from './industrial/industrial-wrong-variation.service'
import { IndustrialKbBindService } from './industrial/industrial-kb-bind.service'
import { ChemTrainItem } from './train/entities/chem-train-item.entity'
import { ChemTrainItemAsset } from './train/entities/chem-train-item-asset.entity'
import { ChemTrainItemLink } from './train/entities/chem-train-item-link.entity'
import { ChemTrainSession } from './train/entities/chem-train-session.entity'
import { ChemTrainSessionItem } from './train/entities/chem-train-session-item.entity'
import { ChemTrainSessionItemAsset } from './train/entities/chem-train-session-item-asset.entity'
import { ChemTrainSessionDiagramService } from './train/chem-train-session-diagram.service'
import { ChemTrainTestGrant } from './train/entities/chem-train-test-grant.entity'
import { ChemWrongEvent } from './train/entities/chem-wrong-event.entity'
import { ChemWrongItem } from './train/entities/chem-wrong-item.entity'
import { ChemConcept } from './kb/entities/chem-concept.entity'
import { ChemElement } from './kb/entities/chem-element.entity'
import {
  ChemExperiment,
  ChemExperimentImage,
} from './kb/entities/chem-experiment.entity'
import { ChemFormula } from './kb/entities/chem-formula.entity'
import { ChemKnowledgePoint } from './kb/entities/chem-knowledge-point.entity'
import {
  ChemEntityCategory,
  ChemEntitySpecialty,
  ChemExperimentReaction,
  ChemExperimentSubstance,
  ChemKbLink,
  ChemKpLink,
  ChemQuestionKp,
  ChemReactionElement,
  ChemReactionSubstance,
} from './kb/entities/chem-link.entities'
import { ChemQuestion } from './kb/entities/chem-question.entity'
import {
  ChemReaction,
  ChemReactionSpecies,
  ChemReactionTag,
} from './kb/entities/chem-reaction.entity'
import {
  ChemSubstance,
  ChemSubstanceElement,
  ChemSubstanceTag,
} from './kb/entities/chem-substance.entity'

const KB_ENTITIES = [
  ChemElement,
  ChemSubstance,
  ChemSubstanceTag,
  ChemSubstanceElement,
  ChemReaction,
  ChemReactionTag,
  ChemReactionSpecies,
  ChemExperiment,
  ChemExperimentImage,
  ChemFormula,
  ChemConcept,
  ChemKnowledgePoint,
  ChemQuestion,
  ChemEntitySpecialty,
  ChemEntityCategory,
  ChemKpLink,
  ChemQuestionKp,
  ChemReactionSubstance,
  ChemReactionElement,
  ChemExperimentReaction,
  ChemExperimentSubstance,
  ChemKbLink,
]

const TRAIN_ENTITIES = [
  ChemTrainItem,
  ChemTrainItemAsset,
  ChemTrainItemLink,
  ChemTrainTestGrant,
  ChemTrainSession,
  ChemTrainSessionItem,
  ChemTrainSessionItemAsset,
  ChemWrongItem,
  ChemWrongEvent,
]

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ChemSpecialty,
      ChemCategory,
      ...KB_ENTITIES,
      ...TRAIN_ENTITIES,
    ]),
    AuthModule,
  ],
  controllers: [
    ChemistryController,
    ChemKbController,
    ChemKbAdminController,
    ChemTrainController,
    ChemDailyReviewController,
    ChemAdvancedTrainController,
    ChemWrongQuestionController,
    ChemLearningHomeController,
    ChemAnalyticsController,
    LocalGeneratorController,
    TrainItemsAdminController,
    IndustrialReviewController,
  ],
  providers: [
    ChemistryService,
    ChemKbService,
    ChemKbImportService,
    ChemTrainEligibilityService,
    ChemTrainSessionDiagramService,
    ChemTrainService,
    ChemDailyReviewService,
    ChemAdvancedTrainService,
    ChemWrongQuestionService,
    ChemLearningHomeService,
    ChemAnalyticsService,
    LocalGeneratorService,
    TrainItemsAdminService,
    IndustrialReviewNestService,
    IndustrialFormalImportDbService,
    IndustrialItemAssetQueryService,
    IndustrialWrongVariationService,
    IndustrialKbBindService,
    IndustrialExperimentEnabledGuard,
    AdminGuard,
  ],
  exports: [
    ChemistryService,
    ChemKbService,
    ChemTrainService,
    ChemWrongQuestionService,
    IndustrialItemAssetQueryService,
    IndustrialWrongVariationService,
    IndustrialKbBindService,
  ],
})
export class ChemistryModule {}
