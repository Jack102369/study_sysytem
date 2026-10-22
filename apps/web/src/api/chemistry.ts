import http, { type ApiSuccess } from './http'

export type ChemSpecialtySummary = {
  id: string
  code: string
  name: string
  icon: string | null
  intro: string
  sortOrder: number
  categoryCount: number
}

export type ChemCategoryItem = {
  id: string
  code: string
  name: string
  sortOrder: number
}

export type ChemSpecialtyDetail = ChemSpecialtySummary & {
  categories: ChemCategoryItem[]
}

export async function listChemSpecialties() {
  const { data } = await http.get<ApiSuccess<ChemSpecialtySummary[]>>(
    '/chemistry/specialties',
  )
  return data.data
}

export async function getChemSpecialty(code: string) {
  const { data } = await http.get<ApiSuccess<ChemSpecialtyDetail>>(
    `/chemistry/specialties/${encodeURIComponent(code)}`,
  )
  return data.data
}
