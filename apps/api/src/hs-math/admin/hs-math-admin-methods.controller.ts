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
  CreateHsMathMethodDto,
  ListHsMathMethodsQueryDto,
  UpdateHsMathMethodDto,
} from '../dto/admin-method.dto'
import { HsMathAdminMethodsService } from './hs-math-admin-methods.service'

@Controller('hs-math/admin/methods')
@UseGuards(JwtAuthGuard, AdminGuard)
export class HsMathAdminMethodsController {
  constructor(private readonly service: HsMathAdminMethodsService) {}

  @Get()
  list(@Query() query: ListHsMathMethodsQueryDto) {
    return this.service.list(query)
  }

  @Post()
  create(@Body() dto: CreateHsMathMethodDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateHsMathMethodDto) {
    return this.service.update(id, dto)
  }
}
