import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ATTACHMENT_MAX_BYTES } from '../constants/biz'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'string') {
        message = body
      } else if (body && typeof body === 'object' && 'message' in body) {
        const msg = (body as { message: string | string[] }).message
        message = Array.isArray(msg) ? msg.join(', ') : String(msg)
      } else {
        message = exception.message
      }
    } else if (
      exception &&
      typeof exception === 'object' &&
      'code' in exception &&
      (exception as { code?: string }).code === 'LIMIT_FILE_SIZE'
    ) {
      status = HttpStatus.BAD_REQUEST
      const mb = Math.round(ATTACHMENT_MAX_BYTES / (1024 * 1024))
      message = `文件过大，最大支持 ${mb}MB`
    } else if (exception instanceof Error) {
      if (exception.message === 'File too large') {
        status = HttpStatus.BAD_REQUEST
        message = `文件过大，最大支持 ${Math.round(ATTACHMENT_MAX_BYTES / (1024 * 1024))}MB`
      } else {
        message = exception.message
      }
    }

    response.status(status).json({
      success: false,
      message,
    })
  }
}
