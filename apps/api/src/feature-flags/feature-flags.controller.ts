import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../auth/admin.guard'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SetFeatureFlagDto } from './dto/feature-flag.dto'
import { FeatureFlagsService } from './feature-flags.service'

@Controller()
export class FeatureFlagsController {
  constructor(private readonly service: FeatureFlagsService) {}

  /** 登录用户可读（用于前端按页面显隐按钮） */
  @Get('feature-flags')
  @UseGuards(JwtAuthGuard)
  list() {
    return this.service.list()
  }

  /** 仅管理员可改 */
  @Patch('admin/feature-flags/:key')
  @UseGuards(JwtAuthGuard, AdminGuard)
  setEnabled(@Param('key') key: string, @Body() dto: SetFeatureFlagDto) {
    return this.service.setEnabled(decodeURIComponent(key), dto.enabled)
  }
}
