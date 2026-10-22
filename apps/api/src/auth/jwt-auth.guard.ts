import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'
import type { UserRole } from '../common/constants/biz'

export type JwtPayload = {
  sub: string
  email: string
  role?: UserRole
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>()
    const token = this.extractBearerToken(request)
    if (!token) {
      throw new UnauthorizedException('未登录或令牌无效')
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
      if (!payload?.sub) {
        throw new UnauthorizedException('未登录或令牌无效')
      }
      request.user = payload
      return true
    } catch {
      throw new UnauthorizedException('未登录或令牌无效')
    }
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization
    if (!header) return null
    const [type, token] = header.split(' ')
    if (type !== 'Bearer' || !token) return null
    return token
  }
}
