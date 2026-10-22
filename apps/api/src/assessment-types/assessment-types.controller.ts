import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { AssessmentTypesService } from './assessment-types.service'
import { CreateAssessmentTypeDto } from './dto/create-assessment-type.dto'
import { ListAssessmentTypesQueryDto } from './dto/list-assessment-types-query.dto'
import { UpdateAssessmentTypeDto } from './dto/update-assessment-type.dto'

@Controller('assessment-types')
@UseGuards(JwtAuthGuard)
export class AssessmentTypesController {
  constructor(private readonly assessmentTypesService: AssessmentTypesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListAssessmentTypesQueryDto,
  ) {
    return this.assessmentTypesService.list(user.sub, query.includeArchived)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAssessmentTypeDto) {
    return this.assessmentTypesService.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentTypeDto,
  ) {
    return this.assessmentTypesService.update(user.sub, id, dto)
  }
}
