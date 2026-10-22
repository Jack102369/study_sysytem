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
import { CreateSubjectDto } from './dto/create-subject.dto'
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto'
import { UpdateSubjectDto } from './dto/update-subject.dto'
import { SubjectsService } from './subjects.service'

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListSubjectsQueryDto) {
    return this.subjectsService.list(user.sub, query.includeArchived)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSubjectDto) {
    return this.subjectsService.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(user.sub, id, dto)
  }
}
