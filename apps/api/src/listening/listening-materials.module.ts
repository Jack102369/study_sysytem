import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AttachmentsModule } from '../attachments/attachments.module'
import { AuthModule } from '../auth/auth.module'
import { PointsModule } from '../points/points.module'
import { ListeningMaterial } from './listening-material.entity'
import { ListeningMaterialsController } from './listening-materials.controller'
import { ListeningMaterialsService } from './listening-materials.service'
import { PiperTtsService } from './piper-tts.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ListeningMaterial]),
    AuthModule,
    AttachmentsModule,
    PointsModule,
  ],
  controllers: [ListeningMaterialsController],
  providers: [ListeningMaterialsService, PiperTtsService],
  exports: [ListeningMaterialsService],
})
export class ListeningMaterialsModule {}
