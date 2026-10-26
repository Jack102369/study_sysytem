import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { HsMathHomeService } from '../train/hs-math-home.service'

@Controller('hs-math')
@UseGuards(JwtAuthGuard)
export class HsMathHomeController {
  constructor(private readonly home: HsMathHomeService) {}

  @Get('home')
  getHome(@CurrentUser() user: JwtPayload) {
    return this.home.getHome(user.sub)
  }
}
