import { CanActivate, Injectable, NotFoundException } from '@nestjs/common'
import { isChemIndustrialExperimentEnabled } from './industrial-feature.config'

/**
 * 工业实验专属 Controller 统一闸门：关闭 → 404。
 * 仍须叠加 JwtAuthGuard / AdminGuard（本 Guard 不替代鉴权）。
 */
@Injectable()
export class IndustrialExperimentEnabledGuard implements CanActivate {
  canActivate(): boolean {
    if (!isChemIndustrialExperimentEnabled()) {
      throw new NotFoundException('NOT_FOUND')
    }
    return true
  }
}
