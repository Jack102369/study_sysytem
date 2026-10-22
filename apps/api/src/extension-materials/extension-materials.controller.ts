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
import {
  CreateExtensionMaterialDto,
  ListExtensionMaterialsQueryDto,
  UpdateExtensionMaterialDto,
} from './dto/extension-material.dto'
import { ExtensionMaterialsService } from './extension-materials.service'

@Controller('extension-materials')
@UseGuards(JwtAuthGuard)
export class ExtensionMaterialsController {
  constructor(private readonly service: ExtensionMaterialsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListExtensionMaterialsQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateExtensionMaterialDto) {
    return this.service.create(user.sub, dto)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExtensionMaterialDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
