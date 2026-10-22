export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'app_theme'

export function getStoredTheme(): ThemeMode {
  const v = localStorage.getItem(STORAGE_KEY)
  // 未选过主题时默认深色
  if (v === 'light') return 'light'
  return 'dark'
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  root.dataset.theme = mode
  localStorage.setItem(STORAGE_KEY, mode)
}

export function initTheme() {
  applyTheme(getStoredTheme())
}
