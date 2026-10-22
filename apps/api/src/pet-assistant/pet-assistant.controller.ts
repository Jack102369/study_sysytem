import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { PetChatDto, UpdatePetPrefsDto } from './dto/pet-assistant.dto'
import { PetAssistantService } from './pet-assistant.service'

@Controller('pet-assistant')
@UseGuards(JwtAuthGuard)
export class PetAssistantController {
  constructor(private readonly service: PetAssistantService) {}

  @Get('prefs')
  getPrefs(@CurrentUser() user: JwtPayload) {
    return this.service.getPrefs(user.sub)
  }

  @Patch('prefs')
  updatePrefs(@CurrentUser() user: JwtPayload, @Body() dto: UpdatePetPrefsDto) {
    return this.service.updatePrefs(user.sub, dto)
  }

  @Post('chat')
  chat(@CurrentUser() user: JwtPayload, @Body() dto: PetChatDto) {
    return this.service.chat(user.sub, dto)
  }
}
