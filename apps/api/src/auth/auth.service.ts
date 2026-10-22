import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { BootstrapDefaultsService } from '../common/bootstrap-defaults.service'
import type { UserRole } from '../common/constants/biz'
import { User } from '../users/user.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

export type AuthUserView = {
  id: string
  email: string
  nickname: string
  grade: string
  role: UserRole
  isDisabled: boolean
  ocrEnabled: boolean
  aiEnabled: boolean
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly bootstrapDefaults: BootstrapDefaultsService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthUserView> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (exists) {
      throw new ConflictException('邮箱已注册')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.usersRepo.create({
      email: dto.email,
      passwordHash,
      nickname: dto.nickname,
      grade: dto.grade,
      role: 'USER',
      isDisabled: false,
      ocrEnabled: false,
      aiEnabled: false,
    })

    try {
      const saved = await this.usersRepo.save(user)
      await this.bootstrapDefaults.seedForUser(String(saved.id))
      return this.toView(saved)
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('邮箱已注册')
      }
      throw error
    }
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    if (user.isDisabled) {
      throw new UnauthorizedException('账号已停用，请联系管理员')
    }

    const matched = await bcrypt.compare(dto.password, user.passwordHash)
    if (!matched) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: String(user.id),
      email: user.email,
      role: user.role,
    })

    return { accessToken }
  }

  async getMe(userId: string): Promise<AuthUserView> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('用户不存在或未登录')
    }
    if (user.isDisabled) {
      throw new UnauthorizedException('账号已停用，请联系管理员')
    }
    return this.toView(user)
  }

  toView(user: User): AuthUserView {
    return {
      id: String(user.id),
      email: user.email,
      nickname: user.nickname,
      grade: user.grade,
      role: user.role,
      isDisabled: !!user.isDisabled,
      ocrEnabled: !!user.ocrEnabled,
      aiEnabled: !!user.aiEnabled,
    }
  }

  private isDuplicateEmailError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'ER_DUP_ENTRY'
    )
  }
}
