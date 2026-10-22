import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../../../auth/admin.guard'
import { CurrentUser } from '../../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../../auth/jwt-auth.guard'
import { GeneratorConfirmDto, GeneratorPreviewDto } from './generator.dto'
import { LocalGeneratorService } from './local-generator.service'

@Controller('chemistry/admin/train-generator')
@UseGuards(JwtAuthGuard, AdminGuard)
export class LocalGeneratorController {
  constructor(private readonly generator: LocalGeneratorService) {}

  @Get('meta')
  meta() {
    return this.generator.meta()
  }

  @Get('utilization')
  utilization() {
    return this.generator.utilization()
  }

  @Post('preview')
  preview(@CurrentUser() user: JwtPayload, @Body() dto: GeneratorPreviewDto) {
    return this.generator.preview(user.sub, dto)
  }

  @Post('confirm')
  confirm(@CurrentUser() user: JwtPayload, @Body() dto: GeneratorConfirmDto) {
    return this.generator.confirm(user.sub, dto)
  }
}
