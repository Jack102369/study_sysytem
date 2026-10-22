import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { DataSource } from 'typeorm'

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    try {
      await this.dataSource.query('SELECT 1')
      return { app: 'api', db: 'ok' }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Database connection failed'
      throw new ServiceUnavailableException(message)
    }
  }
}
