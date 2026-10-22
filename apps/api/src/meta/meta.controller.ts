import { Controller, Get } from '@nestjs/common'
import { GRADES } from '../common/constants/grades'

@Controller('meta')
export class MetaController {
  @Get('grades')
  grades() {
    return [...GRADES]
  }
}
