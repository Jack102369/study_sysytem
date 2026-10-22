import {
  BadRequestException,
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
  AiFetchKnowledgeDto,
  BatchCreateKnowledgeCardsDto,
  CreateKnowledgeCardDto,
  LinkErrorDto,
  ListKnowledgeCardsQueryDto,
  UpdateKnowledgeCardDto,
} from './dto/knowledge-cards.dto'
import { KnowledgeCardsService } from './knowledge-cards.service'

@Controller('knowledge-cards')
@UseGuards(JwtAuthGuard)
export class KnowledgeCardsController {
  constructor(private readonly service: KnowledgeCardsService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListKnowledgeCardsQueryDto,
  ) {
    return this.service.list(user.sub, query)
  }

  @Get('by-error/:errorId')
  listByError(
    @CurrentUser() user: JwtPayload,
    @Param('errorId') errorId: string,
  ) {
    return this.service.listByError(user.sub, errorId)
  }

  @Post('ai-fetch')
  aiFetch(@CurrentUser() user: JwtPayload, @Body() dto: AiFetchKnowledgeDto) {
    return this.service.aiFetch(user.sub, dto)
  }

  @Post('batch')
  batchCreate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BatchCreateKnowledgeCardsDto,
  ) {
    return this.service.batchCreate(user.sub, dto)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateKnowledgeCardDto) {
    return this.service.create(user.sub, dto)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, assertCardId(id))
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateKnowledgeCardDto,
  ) {
    return this.service.update(user.sub, assertCardId(id), dto)
  }

  @Post(':id/link-error')
  linkError(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: LinkErrorDto,
  ) {
    return this.service.linkError(user.sub, assertCardId(id), dto.errorQuestionId)
  }

  @Delete(':id/link-error/:errorId')
  unlinkError(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('errorId') errorId: string,
  ) {
    return this.service.unlinkError(user.sub, assertCardId(id), errorId)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, assertCardId(id))
  }
}

function assertCardId(id: string) {
  if (!/^\d+$/.test(String(id || ''))) {
    throw new BadRequestException('无效的知识点 ID')
  }
  return id
}
