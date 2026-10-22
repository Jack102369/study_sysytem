import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { UpdateStudyPrefsDto } from './dto/study-prefs.dto'
import { StudyPrefsService } from './study-prefs.service'

@Controller('study-prefs')
@UseGuards(JwtAuthGuard)
export class StudyPrefsController {
  constructor(private readonly service: StudyPrefsService) {}

  @Get()
  get(@CurrentUser() user: JwtPayload) {
    return this.service.getOrCreate(user.sub)
  }

  @Patch()
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateStudyPrefsDto) {
    return this.service.update(user.sub, dto)
  }
}
