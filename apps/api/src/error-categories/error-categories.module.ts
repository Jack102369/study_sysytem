import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { ErrorCategoriesController } from './error-categories.controller'
import { ErrorCategoriesService } from './error-categories.service'
import { ErrorCategory } from './error-category.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([ErrorCategory]),
    AuthModule,
    SubjectsModule,
  ],
  controllers: [ErrorCategoriesController],
  providers: [ErrorCategoriesService],
  exports: [ErrorCategoriesService],
})
export class ErrorCategoriesModule {}
