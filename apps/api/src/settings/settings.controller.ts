import { Controller, Get, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { AssessmentTypesService } from '../assessment-types/assessment-types.service'
import { BootstrapDefaultsService } from '../common/bootstrap-defaults.service'
import { SubjectsService } from '../subjects/subjects.service'
import { TagsService } from '../tags/tags.service'

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly subjectsService: SubjectsService,
    private readonly tagsService: TagsService,
    private readonly assessmentTypesService: AssessmentTypesService,
    private readonly bootstrapDefaults: BootstrapDefaultsService,
  ) {}

  @Get('bootstrap')
  async bootstrap(@CurrentUser() user: JwtPayload) {
    const [subjects, tags, assessmentTypes] = await Promise.all([
      this.subjectsService.list(user.sub),
      this.tagsService.list(user.sub),
      this.assessmentTypesService.list(user.sub),
    ])
    return { subjects, tags, assessmentTypes }
  }

  @Post('seed-defaults')
  async seedDefaults(@CurrentUser() user: JwtPayload) {
    await this.bootstrapDefaults.seedForUser(user.sub)
    return this.bootstrap(user)
  }
}
