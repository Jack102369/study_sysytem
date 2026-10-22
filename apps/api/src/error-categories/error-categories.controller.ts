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
import { CreateErrorCategoryDto } from './dto/create-error-category.dto'
import { ListErrorCategoriesQueryDto } from './dto/list-error-categories-query.dto'
import { UpdateErrorCategoryDto } from './dto/update-error-category.dto'
import { ErrorCategoriesService } from './error-categories.service'

@Controller('error-categories')
@UseGuards(JwtAuthGuard)
export class ErrorCategoriesController {
  constructor(private readonly errorCategoriesService: ErrorCategoriesService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListErrorCategoriesQueryDto,
  ) {
    return this.errorCategoriesService.list(
      user.sub,
      query.subjectId,
      query.includeArchived,
      query.includeGlobal,
    )
  }

  @Post('ensure-special')
  ensureSpecial(@CurrentUser() user: JwtPayload) {
    return this.errorCategoriesService.ensureSpecialExtensionCategory(user.sub)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateErrorCategoryDto) {
    return this.errorCategoriesService.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateErrorCategoryDto,
  ) {
    return this.errorCategoriesService.update(user.sub, id, dto)
  }
}
