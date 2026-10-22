import { computed, ref, watch } from 'vue'
import { applyTheme, getStoredTheme, type ThemeMode } from '@/utils/theme'

const theme = ref<ThemeMode>(getStoredTheme())

watch(
  theme,
  (mode) => {
    applyTheme(mode)
  },
  { immediate: true },
)

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(mode: ThemeMode) {
    theme.value = mode
  }

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, isDark, setTheme, toggleTheme }
}
