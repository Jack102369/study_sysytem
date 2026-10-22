import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { CurrentUser } from '../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../auth/jwt-auth.guard'
import { AttachmentsService } from './attachments.service'
import { ATTACHMENT_MAX_BYTES } from '../common/constants/biz'

const uploadRoot = join(process.cwd(), 'uploads')

@Controller('attachments')
@UseGuards(JwtAuthGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          if (!existsSync(uploadRoot)) mkdirSync(uploadRoot, { recursive: true })
          cb(null, uploadRoot)
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
          cb(null, `${unique}${extname(file.originalname)}`)
        },
      }),
      limits: { fileSize: ATTACHMENT_MAX_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file?: Express.Multer.File,
    @Body('originalName') originalNameFromBody?: string,
  ) {
    if (!file) throw new BadRequestException('请上传文件')
    const url = `/uploads/${file.filename}`
    let originalName = (originalNameFromBody || '').trim()
    if (!originalName) {
      try {
        originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')
      } catch {
        originalName = file.originalname || file.filename
      }
    }
    return this.attachmentsService.createLocal(
      user.sub,
      url,
      file.mimetype,
      originalName || file.filename,
    )
  }
}
