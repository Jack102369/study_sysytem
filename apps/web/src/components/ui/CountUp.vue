<template>
  <span>{{ display }}</span>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number | string
    duration?: number
  }>(),
  { duration: 700 },
)

const display = ref(String(props.value))

function parseTarget(raw: number | string): { kind: 'num'; n: number; suffix: string } | { kind: 'text'; t: string } {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return { kind: 'num', n: raw, suffix: '' }
  }
  const s = String(raw).trim()
  const m = s.match(/^(-?\d+(?:\.\d+)?)(.*)$/)
  if (m) {
    return { kind: 'num', n: Number(m[1]), suffix: m[2] || '' }
  }
  return { kind: 'text', t: s }
}

function animateTo(raw: number | string) {
  const parsed = parseTarget(raw)
  if (parsed.kind === 'text') {
    display.value = parsed.t
    return
  }
  const { n: to, suffix } = parsed
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduce) {
    display.value = `${to}${suffix}`
    return
  }
  const start = performance.now()
  const from = 0
  const dur = props.duration
  const decimals = String(to).includes('.')
    ? (String(to).split('.')[1]?.length || 0)
    : 0

  function frame(now: number) {
    const t = Math.min(1, (now - start) / dur)
    const eased = 1 - Math.pow(1 - t, 3)
    const cur = from + (to - from) * eased
    display.value = `${cur.toFixed(decimals)}${suffix}`
    if (t < 1) requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}

watch(
  () => props.value,
  (v) => animateTo(v),
)

onMounted(() => animateTo(props.value))
</script>
