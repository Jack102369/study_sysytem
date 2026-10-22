import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator'
import {
  CHEM_ENTITY_TYPES,
  CHEM_KB_STATUSES,
  QUESTION_TYPES,
  REACTION_SPECIES_ROLES,
  SUBSTANCE_TAGS,
} from '../kb.constants'

export class ChemKbListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number

  @IsOptional()
  @IsString()
  @MaxLength(128)
  q?: string

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class ChemKbStatusPatchDto {
  @IsIn([...CHEM_KB_STATUSES])
  status!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reviewNote?: string
}

export class ChemKbLinkItemDto {
  @IsIn([...CHEM_ENTITY_TYPES])
  toType!: string

  @IsString()
  toId!: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  note?: string
}

export class ChemKpTargetDto {
  @IsIn([...CHEM_ENTITY_TYPES.filter((t) => t !== 'question')])
  targetType!: string

  @IsString()
  targetId!: string
}

export class ChemKbSetLinksDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialtyIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categoryIds?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemKbLinkItemDto)
  kbLinks?: ChemKbLinkItemDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemKpTargetDto)
  kpTargets?: ChemKpTargetDto[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  substanceIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  elementIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reactionIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  knowledgePointIds?: string[]

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageAttachmentIds?: string[]
}

export class CreateChemElementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  symbol!: string

  @IsString()
  @MinLength(1)
  @MaxLength(32)
  nameZh!: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nameEn?: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  atomicNumber!: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  atomicMass?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodNo?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(16)
  groupLabel?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(64)
  commonValences?: string | null

  @IsOptional()
  @IsString()
  atomStructure?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  electronConfig?: string | null

  @IsOptional()
  @IsString()
  commonCompounds?: string | null

  @IsOptional()
  @IsString()
  keyProperties?: string | null

  @IsOptional()
  @IsString()
  commonUses?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemElementDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(8)
  symbol?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  nameZh?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  nameEn?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  atomicNumber?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  atomicMass?: number | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  periodNo?: number | null

  @IsOptional()
  @IsString()
  @MaxLength(16)
  groupLabel?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(64)
  commonValences?: string | null

  @IsOptional()
  @IsString()
  atomStructure?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  electronConfig?: string | null

  @IsOptional()
  @IsString()
  commonCompounds?: string | null

  @IsOptional()
  @IsString()
  keyProperties?: string | null

  @IsOptional()
  @IsString()
  commonUses?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class ChemSubstanceElementItemDto {
  @IsString()
  elementId!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  atomCount?: number
}

export class CreateChemSubstanceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  canonicalFormula!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  commonNames?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  stateLabel?: string

  @IsOptional()
  @IsString()
  solubility?: string | null

  @IsOptional()
  @IsString()
  physicalProps?: string | null

  @IsOptional()
  @IsString()
  chemicalProps?: string | null

  @IsOptional()
  @IsString()
  commonUses?: string | null

  @IsOptional()
  @IsString()
  testMethods?: string | null

  @IsOptional()
  @IsString()
  storageMethods?: string | null

  @IsOptional()
  @IsString()
  safetyNotes?: string | null

  @IsOptional()
  @IsArray()
  @IsIn([...SUBSTANCE_TAGS], { each: true })
  tags?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemSubstanceElementItemDto)
  elements?: ChemSubstanceElementItemDto[]

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemSubstanceDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  canonicalFormula?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  commonNames?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  stateLabel?: string

  @IsOptional()
  @IsString()
  solubility?: string | null

  @IsOptional()
  @IsString()
  physicalProps?: string | null

  @IsOptional()
  @IsString()
  chemicalProps?: string | null

  @IsOptional()
  @IsString()
  commonUses?: string | null

  @IsOptional()
  @IsString()
  testMethods?: string | null

  @IsOptional()
  @IsString()
  storageMethods?: string | null

  @IsOptional()
  @IsString()
  safetyNotes?: string | null

  @IsOptional()
  @IsArray()
  @IsIn([...SUBSTANCE_TAGS], { each: true })
  tags?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemSubstanceElementItemDto)
  elements?: ChemSubstanceElementItemDto[]

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class ChemReactionSpeciesDto {
  @IsIn([...REACTION_SPECIES_ROLES])
  role!: string

  @IsOptional()
  @IsString()
  substanceId?: string | null

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  formula!: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coefficient?: number

  @IsOptional()
  @IsString()
  @MaxLength(8)
  stateSymbol?: string | null

  @IsOptional()
  @IsBoolean()
  isGas?: boolean

  @IsOptional()
  @IsBoolean()
  isPrecipitate?: boolean

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number
}

export class CreateChemReactionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  canonicalEquation!: string

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  equation!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ionicEquation?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conditions?: string

  @IsOptional()
  @IsString()
  phenomenon?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  oxidant?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  reductant?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  oxProduct?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  reProduct?: string | null

  @IsOptional()
  @IsString()
  electronTransfer?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(255)
  trainTypes?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemReactionSpeciesDto)
  species?: ChemReactionSpeciesDto[]

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemReactionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  canonicalEquation?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  equation?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  ionicEquation?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(255)
  conditions?: string

  @IsOptional()
  @IsString()
  phenomenon?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  oxidant?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  reductant?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  oxProduct?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  reProduct?: string | null

  @IsOptional()
  @IsString()
  electronTransfer?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(255)
  trainTypes?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChemReactionSpeciesDto)
  species?: ChemReactionSpeciesDto[]

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class CreateChemExperimentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string

  @IsOptional()
  @IsString()
  purpose?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  instruments?: string | null

  @IsOptional()
  @IsString()
  reagents?: string | null

  @IsOptional()
  @IsString()
  steps?: string | null

  @IsOptional()
  @IsString()
  phenomenon?: string | null

  @IsOptional()
  @IsString()
  conclusion?: string | null

  @IsOptional()
  @IsString()
  precautions?: string | null

  @IsOptional()
  @IsString()
  safetyNotes?: string | null

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(255)
  homeForbiddenNote?: string

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemExperimentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  category?: string

  @IsOptional()
  @IsString()
  purpose?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  instruments?: string | null

  @IsOptional()
  @IsString()
  reagents?: string | null

  @IsOptional()
  @IsString()
  steps?: string | null

  @IsOptional()
  @IsString()
  phenomenon?: string | null

  @IsOptional()
  @IsString()
  conclusion?: string | null

  @IsOptional()
  @IsString()
  precautions?: string | null

  @IsOptional()
  @IsString()
  safetyNotes?: string | null

  @IsOptional()
  @IsBoolean()
  isHazardous?: boolean

  @IsOptional()
  @IsString()
  @MaxLength(255)
  homeForbiddenNote?: string

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class CreateChemFormulaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  expression!: string

  @IsOptional()
  @IsString()
  variables?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  units?: string

  @IsOptional()
  @IsString()
  applicableConditions?: string | null

  @IsOptional()
  @IsString()
  examples?: string | null

  @IsOptional()
  @IsString()
  commonMistakes?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemFormulaDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  expression?: string

  @IsOptional()
  @IsString()
  variables?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(128)
  units?: string

  @IsOptional()
  @IsString()
  applicableConditions?: string | null

  @IsOptional()
  @IsString()
  examples?: string | null

  @IsOptional()
  @IsString()
  commonMistakes?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class CreateChemConceptDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsOptional()
  @IsString()
  definition?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  applicableConditions?: string | null

  @IsOptional()
  @IsString()
  judgeMethods?: string | null

  @IsOptional()
  @IsString()
  examples?: string | null

  @IsOptional()
  @IsString()
  commonMistakes?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemConceptDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  definition?: string | null

  @IsOptional()
  @IsString()
  principle?: string | null

  @IsOptional()
  @IsString()
  applicableConditions?: string | null

  @IsOptional()
  @IsString()
  judgeMethods?: string | null

  @IsOptional()
  @IsString()
  examples?: string | null

  @IsOptional()
  @IsString()
  commonMistakes?: string | null

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class CreateChemKnowledgePointDto {
  @IsOptional()
  @IsString()
  parentId?: string | null

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name!: string

  @IsOptional()
  @IsString()
  description?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class UpdateChemKnowledgePointDto {
  @IsOptional()
  @IsString()
  parentId?: string | null

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  name?: string

  @IsOptional()
  @IsString()
  description?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  importance?: number

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string
}

export class CreateChemQuestionDto {
  @IsIn([...QUESTION_TYPES])
  qtype!: string

  @IsString()
  @MinLength(1)
  stem!: string

  @IsOptional()
  optionsJson?: unknown | null

  @IsString()
  @MinLength(1)
  answer!: string

  @IsOptional()
  @IsString()
  analysis?: string | null

  @IsOptional()
  @IsString()
  scoring?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reviewNote?: string
}

export class UpdateChemQuestionDto {
  @IsOptional()
  @IsIn([...QUESTION_TYPES])
  qtype?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  stem?: string

  @IsOptional()
  optionsJson?: unknown | null

  @IsOptional()
  @IsString()
  @MinLength(1)
  answer?: string

  @IsOptional()
  @IsString()
  analysis?: string | null

  @IsOptional()
  @IsString()
  scoring?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @IsOptional()
  @IsIn([...CHEM_KB_STATUSES])
  status?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reviewNote?: string
}

export class ChemKbImportItemDto {
  @IsIn([...CHEM_ENTITY_TYPES])
  type!: string

  @IsObject()
  data!: Record<string, unknown>
}

export class ChemKbImportDto {
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => ChemKbImportItemDto)
  items!: ChemKbImportItemDto[]
}
