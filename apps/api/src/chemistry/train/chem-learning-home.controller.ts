import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemLearningHomeService } from './chem-learning-home.service'

@Controller('chemistry/train')
@UseGuards(JwtAuthGuard)
export class ChemLearningHomeController {
  constructor(private readonly service: ChemLearningHomeService) {}

  @Get('learning-home')
  learningHome(@CurrentUser() user: JwtPayload) {
    return this.service.getHome(user.sub)
  }
}
