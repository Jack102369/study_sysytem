import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { ErrorCategoriesModule } from '../error-categories/error-categories.module'
import { PointsModule } from '../points/points.module'
import { SubjectsModule } from '../subjects/subjects.module'
import { ExtensionMaterial } from './extension-material.entity'
import { ExtensionMaterialsController } from './extension-materials.controller'
import { ExtensionMaterialsService } from './extension-materials.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ExtensionMaterial]),
    AuthModule,
    SubjectsModule,
    ErrorCategoriesModule,
    PointsModule,
  ],
  controllers: [ExtensionMaterialsController],
  providers: [ExtensionMaterialsService],
  exports: [ExtensionMaterialsService],
})
export class ExtensionMaterialsModule {}
