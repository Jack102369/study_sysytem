import http, { type ApiSuccess } from './http'
import type { PetSkinId } from '@/components/pet/skins'

export type PetPrefs = {
  userId: string
  skinId: PetSkinId
  petEnabled: boolean
  wakeWordOverrides: Record<string, string>
  updatedAt: string
}

export type PetChatResult = {
  reply: string
  model: string
  skinId: PetSkinId
}

export async function getPetPrefs() {
  const { data } = await http.get<ApiSuccess<PetPrefs>>('/pet-assistant/prefs')
  return data.data
}

export async function updatePetPrefs(payload: {
  skinId?: PetSkinId
  petEnabled?: boolean
  wakeWordOverrides?: Record<string, string>
}) {
  const { data } = await http.patch<ApiSuccess<PetPrefs>>(
    '/pet-assistant/prefs',
    payload,
  )
  return data.data
}

export async function petChat(payload: {
  message: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  context?: string
  skinId?: PetSkinId
}) {
  const { data } = await http.post<ApiSuccess<PetChatResult>>(
    '/pet-assistant/chat',
    payload,
    { timeout: 60000 },
  )
  return data.data
}
