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
import { AdminGuard } from '../../auth/admin.guard'
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'
import {
  CreateHsMathCategoryDto,
  ListHsMathAdminCategoriesQueryDto,
  UpdateHsMathCategoryDto,
} from '../dto/admin-category.dto'
import {
  CreateHsMathSpecialtyDto,
  UpdateHsMathSpecialtyDto,
} from '../dto/admin-specialty.dto'
import { HsMathAdminTaxonomyService } from './hs-math-admin-taxonomy.service'

@Controller('hs-math/admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HsMathAdminTaxonomyController {
  constructor(private readonly service: HsMathAdminTaxonomyService) {}

  @Get('specialties')
  listSpecialties() {
    return this.service.listSpecialties()
  }

  @Post('specialties')
  createSpecialty(@Body() dto: CreateHsMathSpecialtyDto) {
    return this.service.createSpecialty(dto)
  }

  @Patch('specialties/:id')
  updateSpecialty(
    @Param('id') id: string,
    @Body() dto: UpdateHsMathSpecialtyDto,
  ) {
    return this.service.updateSpecialty(id, dto)
  }

  @Get('categories')
  listCategories(@Query() query: ListHsMathAdminCategoriesQueryDto) {
    return this.service.listCategories(query)
  }

  @Post('categories')
  createCategory(@Body() dto: CreateHsMathCategoryDto) {
    return this.service.createCategory(dto)
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateHsMathCategoryDto,
  ) {
    return this.service.updateCategory(id, dto)
  }
}
