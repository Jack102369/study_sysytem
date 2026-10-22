import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AssessmentType } from '../assessment-types/assessment-type.entity'
import { ErrorCategory } from '../error-categories/error-category.entity'
import { Tag } from '../tags/tag.entity'
import { BootstrapDefaultsService } from './bootstrap-defaults.service'

@Module({
  imports: [TypeOrmModule.forFeature([Tag, AssessmentType, ErrorCategory])],
  providers: [BootstrapDefaultsService],
  exports: [BootstrapDefaultsService],
})
export class BootstrapDefaultsModule {}
