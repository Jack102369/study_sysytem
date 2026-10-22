import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { AdminGuard } from '../../auth/admin.guard'
import { CurrentUser } from '../../auth/current-user.decorator'
import { JwtAuthGuard, JwtPayload } from '../../auth/jwt-auth.guard'
import { ChemKbImportService } from './chem-kb-import.service'
import { ChemKbService } from './chem-kb.service'
import {
  ChemKbImportDto,
  ChemKbListQueryDto,
  ChemKbSetLinksDto,
  ChemKbStatusPatchDto,
} from './dto/kb.dto'

@Controller('chemistry/admin/kb')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ChemKbAdminController {
  constructor(
    private readonly kb: ChemKbService,
    private readonly importer: ChemKbImportService,
  ) {}

  @Post('import')
  import(@CurrentUser() user: JwtPayload, @Body() dto: ChemKbImportDto) {
    return this.importer.importBatch(dto, user.sub)
  }

  @Get(':type')
  list(@Param('type') type: string, @Query() query: ChemKbListQueryDto) {
    return this.kb.list(type, query, { publishedOnly: false })
  }

  @Get(':type/:id')
  detail(@Param('type') type: string, @Param('id') id: string) {
    return this.kb.get(type, id, { publishedOnly: false })
  }

  @Post(':type')
  create(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.kb.create(type, body, user.sub)
  }

  @Patch(':type/:id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.kb.update(type, id, body, user.sub)
  }

  @Patch(':type/:id/status')
  setStatus(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: ChemKbStatusPatchDto,
  ) {
    return this.kb.setStatus(type, id, dto.status, dto.reviewNote, user.sub)
  }

  @Put(':type/:id/links')
  setLinks(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: ChemKbSetLinksDto,
  ) {
    return this.kb.setLinks(type, id, dto)
  }
}
