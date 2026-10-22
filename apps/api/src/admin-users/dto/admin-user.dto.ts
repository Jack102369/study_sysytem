import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import { USER_ROLES, type UserRole } from '../../common/constants/biz'
import { GRADES, type Grade } from '../../common/constants/grades'

export class CreateAdminUserDto {
  @IsEmail()
  @MaxLength(128)
  email!: string

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  nickname!: string

  @IsIn([...GRADES])
  grade!: Grade

  @IsOptional()
  @IsIn([...USER_ROLES])
  role?: UserRole
}

export class SetUserDisabledDto {
  @IsBoolean()
  isDisabled!: boolean
}

export class SetUserOcrEnabledDto {
  @IsBoolean()
  ocrEnabled!: boolean
}

export class SetUserAiEnabledDto {
  @IsBoolean()
  aiEnabled!: boolean
}

export class SetUserChemTrainTestEnabledDto {
  @IsBoolean()
  chemTrainTestEnabled!: boolean
}

export class ResetUserPasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string
}
