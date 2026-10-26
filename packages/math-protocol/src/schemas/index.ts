import { z } from 'zod'
import { MASP_VERSION } from '../constants/version'

/**
 * Minimal version envelope only — not the full MASP document schema.
 */
export const maspVersionSchema = z.object({
  maspVersion: z.literal(MASP_VERSION),
})

export type MaspVersionEnvelope = z.infer<typeof maspVersionSchema>
