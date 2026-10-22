import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator'
import { GRADES, type Grade } from '../../common/constants/grades'

export class RegisterDto {
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
}
