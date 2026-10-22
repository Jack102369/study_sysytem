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
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemTrainService } from './chem-train.service'
import {
  CreateTrainSessionDto,
  ListTrainSessionsQueryDto,
  SaveTrainAnswerDto,
  TrainAvailabilityQueryDto,
} from './dto/train.dto'

@Controller('chemistry/train')
@UseGuards(JwtAuthGuard)
export class ChemTrainController {
  constructor(private readonly service: ChemTrainService) {}

  @Get('test-access')
  testAccess(@CurrentUser() user: JwtPayload) {
    return this.service.testAccess(user.sub)
  }

  @Get('availability')
  availability(
    @CurrentUser() user: JwtPayload,
    @Query() query: TrainAvailabilityQueryDto,
  ) {
    return this.service.availability(user.sub, query)
  }

  @Get('sessions')
  list(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTrainSessionsQueryDto,
  ) {
    return this.service.listSessions(user.sub, query)
  }

  @Post('sessions')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateTrainSessionDto) {
    return this.service.createSession(user.sub, dto)
  }

  @Get('sessions/:id')
  detail(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.getSession(user.sub, id)
  }

  @Patch('sessions/:id/answers')
  saveAnswer(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SaveTrainAnswerDto,
  ) {
    return this.service.saveAnswer(user.sub, id, dto)
  }

  @Post('sessions/:id/submit')
  submit(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.submit(user.sub, id)
  }

  @Post('sessions/:id/cancel')
  cancel(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.cancel(user.sub, id)
  }
}
