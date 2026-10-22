import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'

@Injectable()
export class AiAccessService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canUseAi(userId: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user || user.isDisabled) return false
    return !!user.aiEnabled
  }

  async assertCanUseAi(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user || user.isDisabled) {
      throw new UnauthorizedException('用户不存在或未登录')
    }
    if (user.aiEnabled) return
    throw new ForbiddenException('无 AI 参考权限，请联系管理员开通')
  }
}
