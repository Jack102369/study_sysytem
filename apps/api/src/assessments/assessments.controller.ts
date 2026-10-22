import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { AssessmentsService } from './assessments.service'
import {
  CreateAssessmentDto,
  ListAssessmentsQueryDto,
  TrendsQueryDto,
  UpdateAssessmentDto,
} from './dto/assessment.dto'

@Controller('assessments')
@UseGuards(JwtAuthGuard)
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListAssessmentsQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Get('trends')
  trends(@CurrentUser() user: JwtPayload, @Query() query: TrendsQueryDto) {
    return this.service.trends(user.sub, query)
  }

  @Get('insight/:subjectId')
  insight(@CurrentUser() user: JwtPayload, @Param('subjectId') subjectId: string) {
    return this.service.insight(user.sub, subjectId)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssessmentDto) {
    return this.service.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
