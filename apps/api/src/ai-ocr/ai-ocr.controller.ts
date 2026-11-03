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
import { AiOcrService } from './ai-ocr.service'
import {
  CreateAiOcrAnalysisDto,
  CreateAiOcrGradingDto,
  CreateAiOcrRecognitionDto,
  ListAiOcrAnalysesQueryDto,
  ListAiOcrGradingsQueryDto,
  ListAiOcrRecognitionsQueryDto,
} from './dto/ai-ocr.dto'

@Controller('ai-ocr')
@UseGuards(JwtAuthGuard)
export class AiOcrController {
  constructor(private readonly service: AiOcrService) {}

  @Get('recognitions')
  listRecognitions(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListAiOcrRecognitionsQueryDto,
  ) {
    return this.service.listRecognitions(user.sub, query)
  }

  @Get('recognitions/:recognitionId')
  getRecognition(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
  ) {
    return this.service.getRecognition(user.sub, recognitionId)
  }

  @Post('recognitions')
  createRecognition(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAiOcrRecognitionDto,
  ) {
    return this.service.createRecognition(user.sub, dto)
  }

  @Get('recognitions/:recognitionId/analyses')
  listAnalyses(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Query() query: ListAiOcrAnalysesQueryDto,
  ) {
    return this.service.listAnalyses(user.sub, recognitionId, query)
  }

  @Get('recognitions/:recognitionId/analyses/:analysisId')
  getAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.service.getAnalysis(user.sub, recognitionId, analysisId)
  }

  @Post('recognitions/:recognitionId/analyses')
  createAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Body() dto: CreateAiOcrAnalysisDto,
  ) {
    return this.service.createAnalysis(user.sub, recognitionId, dto)
  }

  @Delete('recognitions/:recognitionId/analyses/:analysisId')
  deleteAnalysis(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Param('analysisId') analysisId: string,
  ) {
    return this.service.deleteAnalysis(user.sub, recognitionId, analysisId)
  }

  @Get('recognitions/:recognitionId/gradings')
  listGradings(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Query() query: ListAiOcrGradingsQueryDto,
  ) {
    return this.service.listGradings(user.sub, recognitionId, query)
  }

  @Get('recognitions/:recognitionId/gradings/:gradingId')
  getGrading(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Param('gradingId') gradingId: string,
  ) {
    return this.service.getGrading(user.sub, recognitionId, gradingId)
  }

  @Post('recognitions/:recognitionId/gradings')
  createGrading(
    @CurrentUser() user: JwtPayload,
    @Param('recognitionId') recognitionId: string,
    @Body() dto: CreateAiOcrGradingDto,
  ) {
    return this.service.createGrading(user.sub, recognitionId, dto)
  }
}
