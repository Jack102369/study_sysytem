export function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  )
}

export function parseIncludeArchived(value?: string | boolean): boolean {
  if (typeof value === 'boolean') return value
  if (value === undefined || value === null || value === '') return false
  return String(value).toLowerCase() === 'true' || String(value) === '1'
}
