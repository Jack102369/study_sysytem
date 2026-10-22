import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiReferenceModule } from '../ai-reference/ai-reference.module'
import { AuthModule } from '../auth/auth.module'
import { PetAssistantController } from './pet-assistant.controller'
import { PetAssistantService } from './pet-assistant.service'
import { PetChatDaily } from './pet-chat-daily.entity'
import { UserPetPref } from './user-pet-pref.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserPetPref, PetChatDaily]),
    AuthModule,
    AiReferenceModule,
  ],
  controllers: [PetAssistantController],
  providers: [PetAssistantService],
})
export class PetAssistantModule {}
