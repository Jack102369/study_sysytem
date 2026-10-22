import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { BootstrapDefaultsService } from '../common/bootstrap-defaults.service'
import type { UserRole } from '../common/constants/biz'
import { User } from '../users/user.entity'
import {
  CreateAdminUserDto,
  ResetUserPasswordDto,
  SetUserDisabledDto,
  SetUserAiEnabledDto,
  SetUserChemTrainTestEnabledDto,
  SetUserOcrEnabledDto,
} from './dto/admin-user.dto'
import { ChemTrainTestGrant } from '../chemistry/train/entities/chem-train-test-grant.entity'

export type AdminUserView = {
  id: string
  email: string
  nickname: string
  grade: string
  role: UserRole
  isDisabled: boolean
  ocrEnabled: boolean
  aiEnabled: boolean
  /** 个人化学 AI 试运行题库权限（非角色默认；ADMIN 本身即可访问） */
  chemTrainTestEnabled: boolean
  createdAt: Date
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(ChemTrainTestGrant)
    private readonly chemTrainGrantsRepo: Repository<ChemTrainTestGrant>,
    private readonly bootstrapDefaults: BootstrapDefaultsService,
  ) {}

  async list(): Promise<AdminUserView[]> {
    const rows = await this.usersRepo.find({
      order: { id: 'ASC' },
    })
    const grants = await this.chemTrainGrantsRepo.find()
    const grantSet = new Set(grants.map((g) => String(g.userId)))
    return rows.map((u) => this.toView(u, grantSet.has(String(u.id))))
  }

  async create(dto: CreateAdminUserDto): Promise<AdminUserView> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } })
    if (exists) throw new ConflictException('邮箱已注册')

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = this.usersRepo.create({
      email: dto.email.trim(),
      passwordHash,
      nickname: dto.nickname.trim(),
      grade: dto.grade,
      role: dto.role || 'USER',
      isDisabled: false,
      ocrEnabled: false,
      aiEnabled: false,
    })

    try {
      const saved = await this.usersRepo.save(user)
      await this.bootstrapDefaults.seedForUser(String(saved.id))
      return this.toView(saved, false)
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException('邮箱已注册')
      }
      throw error
    }
  }

  async setDisabled(
    operatorId: string,
    targetId: string,
    dto: SetUserDisabledDto,
  ): Promise<AdminUserView> {
    if (String(operatorId) === String(targetId)) {
      throw new BadRequestException('不能停用自己的账号')
    }
    const user = await this.usersRepo.findOne({ where: { id: targetId } })
    if (!user) throw new NotFoundException('用户不存在')

    if (dto.isDisabled && user.role === 'ADMIN') {
      const adminCount = await this.usersRepo.count({
        where: { role: 'ADMIN', isDisabled: false },
      })
      if (adminCount <= 1) {
        throw new BadRequestException('不能停用唯一启用的管理员')
      }
    }

    user.isDisabled = dto.isDisabled
    const saved = await this.usersRepo.save(user)
    return this.toView(saved, await this.hasChemTrainGrant(saved.id))
  }

  async setOcrEnabled(targetId: string, dto: SetUserOcrEnabledDto): Promise<AdminUserView> {
    const user = await this.usersRepo.findOne({ where: { id: targetId } })
    if (!user) throw new NotFoundException('用户不存在')
    user.ocrEnabled = dto.ocrEnabled
    const saved = await this.usersRepo.save(user)
    return this.toView(saved, await this.hasChemTrainGrant(saved.id))
  }

  async setAiEnabled(targetId: string, dto: SetUserAiEnabledDto): Promise<AdminUserView> {
    const user = await this.usersRepo.findOne({ where: { id: targetId } })
    if (!user) throw new NotFoundException('用户不存在')
    user.aiEnabled = dto.aiEnabled
    const saved = await this.usersRepo.save(user)
    return this.toView(saved, await this.hasChemTrainGrant(saved.id))
  }

  async setChemTrainTestEnabled(
    operatorId: string,
    targetId: string,
    dto: SetUserChemTrainTestEnabledDto,
  ): Promise<AdminUserView> {
    const user = await this.usersRepo.findOne({ where: { id: targetId } })
    if (!user) throw new NotFoundException('用户不存在')
    if (user.role === 'ADMIN') {
      throw new BadRequestException('管理员默认可使用化学试运行，无需单独授权')
    }
    const existing = await this.chemTrainGrantsRepo.findOne({
      where: { userId: targetId },
    })
    if (dto.chemTrainTestEnabled) {
      if (!existing) {
        await this.chemTrainGrantsRepo.save(
          this.chemTrainGrantsRepo.create({
            userId: targetId,
            note: 'admin_grant_chem_personal_trial',
            grantedBy: operatorId,
          }),
        )
      }
    } else if (existing) {
      await this.chemTrainGrantsRepo.delete({ userId: targetId })
    }
    return this.toView(user, dto.chemTrainTestEnabled)
  }

  async resetPassword(
    targetId: string,
    dto: ResetUserPasswordDto,
  ): Promise<{ ok: true }> {
    const user = await this.usersRepo.findOne({ where: { id: targetId } })
    if (!user) throw new NotFoundException('用户不存在')

    user.passwordHash = await bcrypt.hash(dto.password, 10)
    await this.usersRepo.save(user)
    return { ok: true }
  }

  private async hasChemTrainGrant(userId: string): Promise<boolean> {
    const g = await this.chemTrainGrantsRepo.findOne({ where: { userId } })
    return !!g
  }

  private toView(user: User, chemTrainTestEnabled: boolean): AdminUserView {
    return {
      id: String(user.id),
      email: user.email,
      nickname: user.nickname,
      grade: user.grade,
      role: user.role,
      isDisabled: !!user.isDisabled,
      ocrEnabled: !!user.ocrEnabled,
      aiEnabled: !!user.aiEnabled,
      chemTrainTestEnabled:
        user.role === 'ADMIN' ? true : !!chemTrainTestEnabled,
      createdAt: user.createdAt,
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
