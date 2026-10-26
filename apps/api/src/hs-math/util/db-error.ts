import { isDuplicateEntryError } from '../../common/utils/db.util'

export function isHsMathDuplicateError(error: unknown): boolean {
  if (isDuplicateEntryError(error)) return true
  if (typeof error !== 'object' || error === null) return false
  const driver = (error as { driverError?: { code?: string } }).driverError
  return driver?.code === 'ER_DUP_ENTRY'
}
