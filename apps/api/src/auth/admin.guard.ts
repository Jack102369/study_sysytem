import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'
import type { JwtPayload } from './jwt-auth.guard'

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>()
    const payload = request.user
    if (!payload?.sub) {
      throw new UnauthorizedException('未登录或令牌无效')
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } })
    if (!user) {
      throw new UnauthorizedException('用户不存在或未登录')
    }
    if (user.isDisabled) {
      throw new UnauthorizedException('账号已停用，请联系管理员')
    }
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException('需要管理员权限')
    }

    // 刷新请求上的角色，避免过期 JWT 误判
    request.user = {
      ...payload,
      role: user.role,
    }
    return true
  }
}
