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
import { AiReferenceService } from './ai-reference.service'
import {
  GenerateAiReferenceDto,
  ListAiReferenceQueryDto,
  OcrFromErrorDto,
  SetVerifyDto,
  UpdateAiReferenceDto,
} from './dto/ai-reference.dto'

@Controller('ai-reference')
@UseGuards(JwtAuthGuard)
export class AiReferenceController {
  constructor(private readonly service: AiReferenceService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query() query: ListAiReferenceQueryDto) {
    return this.service.list(user.sub, query)
  }

  @Post('ocr')
  ocr(@CurrentUser() user: JwtPayload, @Body() dto: OcrFromErrorDto) {
    return this.service.ocrFromError(user.sub, dto)
  }

  @Post('generate')
  generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateAiReferenceDto) {
    return this.service.generate(user.sub, dto)
  }

  @Get(':id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.detail(user.sub, id)
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAiReferenceDto,
  ) {
    return this.service.update(user.sub, id, dto)
  }

  @Patch(':id/verify')
  setVerify(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SetVerifyDto,
  ) {
    return this.service.setVerify(user.sub, id, dto.status)
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.remove(user.sub, id)
  }
}
