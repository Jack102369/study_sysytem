import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../users/user.entity'

@Injectable()
export class OcrAccessService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canUseOcr(userId: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user || user.isDisabled) return false
    return !!user.ocrEnabled
  }

  async assertCanUseOcr(userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } })
    if (!user || user.isDisabled) {
      throw new UnauthorizedException('用户不存在或未登录')
    }
    if (user.ocrEnabled) return
    throw new ForbiddenException('无 OCR 识别权限，请联系管理员开通')
  }
}
