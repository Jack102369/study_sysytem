import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { AssessmentType } from './assessment-type.entity'
import { AssessmentTypesController } from './assessment-types.controller'
import { AssessmentTypesService } from './assessment-types.service'

@Module({
  imports: [TypeOrmModule.forFeature([AssessmentType]), AuthModule],
  controllers: [AssessmentTypesController],
  providers: [AssessmentTypesService],
  exports: [AssessmentTypesService],
})
export class AssessmentTypesModule {}
