import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator'
import { HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM } from '../hs-math.constants'

export class ReorderHsMathItemDiagramsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(HS_MATH_ITEM_DIAGRAM_MAX_PER_ITEM)
  @IsString({ each: true })
  orderedLinkIds!: string[]
}

export class UploadHsMathItemDiagramMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  altText?: string
}

export class ReplaceHsMathItemDiagramMetaDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  altText?: string
}
