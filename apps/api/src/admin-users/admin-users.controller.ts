import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { AdminGuard } from '../auth/admin.guard'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { AdminUsersService } from './admin-users.service'
import {
  CreateAdminUserDto,
  ResetUserPasswordDto,
  SetUserDisabledDto,
  SetUserAiEnabledDto,
  SetUserChemTrainTestEnabledDto,
  SetUserOcrEnabledDto,
} from './dto/admin-user.dto'

@Controller('admin/users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.service.create(dto)
  }

  @Patch(':id/disabled')
  setDisabled(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SetUserDisabledDto,
  ) {
    return this.service.setDisabled(user.sub, id, dto)
  }

  @Patch(':id/ocr-enabled')
  setOcrEnabled(@Param('id') id: string, @Body() dto: SetUserOcrEnabledDto) {
    return this.service.setOcrEnabled(id, dto)
  }

  @Patch(':id/ai-enabled')
  setAiEnabled(@Param('id') id: string, @Body() dto: SetUserAiEnabledDto) {
    return this.service.setAiEnabled(id, dto)
  }

  @Patch(':id/chem-train-test-enabled')
  setChemTrainTestEnabled(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: SetUserChemTrainTestEnabledDto,
  ) {
    return this.service.setChemTrainTestEnabled(user.sub, id, dto)
  }

  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    return this.service.resetPassword(id, dto)
  }
}
