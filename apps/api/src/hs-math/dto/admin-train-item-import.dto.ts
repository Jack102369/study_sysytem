import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsString,
  MinLength,
} from 'class-validator'
import { HS_MATH_IMPORT_MAX_ITEMS } from '../types/import-protocol'

export class PreviewHsMathTrainItemsImportDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(HS_MATH_IMPORT_MAX_ITEMS)
  items!: unknown[]
}

export class ConfirmHsMathTrainItemsImportDto {
  @IsString()
  @MinLength(20)
  previewToken!: string

  /** 须与 preview 时完全一致（含顺序） */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(HS_MATH_IMPORT_MAX_ITEMS)
  items!: unknown[]
}
