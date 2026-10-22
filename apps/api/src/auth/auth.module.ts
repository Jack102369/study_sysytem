import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BootstrapDefaultsModule } from '../common/bootstrap-defaults.module'
import { User } from '../users/user.entity'
import { UsersModule } from '../users/users.module'
import { AdminGuard } from './admin.guard'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'
import { AiAccessService } from './ai-access.service'
import { OcrAccessService } from './ocr-access.service'

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([User]),
    BootstrapDefaultsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = config.get<string>('JWT_EXPIRES_IN', '7d')
        return {
          secret: config.getOrThrow<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as `${number}d` | `${number}h` | `${number}s`,
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminGuard, OcrAccessService, AiAccessService],
  exports: [
    AuthService,
    JwtModule,
    JwtAuthGuard,
    AdminGuard,
    OcrAccessService,
    AiAccessService,
  ],
})
export class AuthModule {}
