import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { StudyPrefsController } from './study-prefs.controller'
import { StudyPrefsService } from './study-prefs.service'
import { UserStudyPref } from './user-study-pref.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserStudyPref]), AuthModule],
  controllers: [StudyPrefsController],
  providers: [StudyPrefsService],
  exports: [StudyPrefsService],
})
export class StudyPrefsModule {}
