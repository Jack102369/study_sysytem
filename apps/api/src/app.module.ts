import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentTypesModule } from './assessment-types/assessment-types.module'
import { AssessmentsModule } from './assessments/assessments.module'
import { AttachmentsModule } from './attachments/attachments.module'
import { AuthModule } from './auth/auth.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { ErrorCategoriesModule } from './error-categories/error-categories.module'
import { ErrorQuestionsModule } from './error-questions/error-questions.module'
import { ExtensionMaterialsModule } from './extension-materials/extension-materials.module'
import { HealthModule } from './health/health.module'
import { ListeningMaterialsModule } from './listening/listening-materials.module'
import { MetaModule } from './meta/meta.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SettingsModule } from './settings/settings.module'
import { SubjectsModule } from './subjects/subjects.module'
import { TagsModule } from './tags/tags.module'
import { UsersModule } from './users/users.module'
import { AdminUsersModule } from './admin-users/admin-users.module'
import { AiReferenceModule } from './ai-reference/ai-reference.module'
import { FeatureFlagsModule } from './feature-flags/feature-flags.module'
import { WritingCoachModule } from './writing-coach/writing-coach.module'
import { StudyPrefsModule } from './study-prefs/study-prefs.module'
import { PointsModule } from './points/points.module'
import { KnowledgeCardsModule } from './knowledge-cards/knowledge-cards.module'
import { PetAssistantModule } from './pet-assistant/pet-assistant.module'
import { ChemistryModule } from './chemistry/chemistry.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USER', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'study_system'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    UsersModule,
    AuthModule,
    AdminUsersModule,
    MetaModule,
    HealthModule,
    SubjectsModule,
    TagsModule,
    ErrorCategoriesModule,
    AssessmentTypesModule,
    SettingsModule,
    ErrorQuestionsModule,
    ExtensionMaterialsModule,
    ListeningMaterialsModule,
    ReviewsModule,
    AttachmentsModule,
    AssessmentsModule,
    DashboardModule,
    AiReferenceModule,
    WritingCoachModule,
    FeatureFlagsModule,
    StudyPrefsModule,
    PointsModule,
    KnowledgeCardsModule,
    PetAssistantModule,
    ChemistryModule,
  ],
})
export class AppModule {}
