import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import {
  CreateListeningMaterialDto,
  ListListeningMaterialsQueryDto,
} from './dto/listening-material.dto'
import { ListeningMaterialsService } from './listening-materials.service'

@Controller('listening-materials')
@UseGuards(JwtAuthGuard)
export class ListeningMaterialsController {
  constructor(private readonly service: ListeningMaterialsService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListListeningMaterialsQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Get('voices')
  voices() {
    return this.service.listVoices()
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateListeningMaterialDto) {
    return this.service.create(user.sub, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
