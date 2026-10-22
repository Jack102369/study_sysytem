import { Module } from '@nestjs/common'
import { AssessmentTypesModule } from '../assessment-types/assessment-types.module'
import { AuthModule } from '../auth/auth.module'
import { BootstrapDefaultsModule } from '../common/bootstrap-defaults.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { TagsModule } from '../tags/tags.module'
import { SettingsController } from './settings.controller'

@Module({
  imports: [
    AuthModule,
    SubjectsModule,
    TagsModule,
    AssessmentTypesModule,
    BootstrapDefaultsModule,
  ],
  controllers: [SettingsController],
})
export class SettingsModule {}
