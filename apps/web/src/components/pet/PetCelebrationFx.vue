<template>
  <canvas ref="canvasRef" class="fx-canvas" aria-hidden="true" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  active: boolean
}>()

type Petal = {
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  hue: number
  life: number
}

type Spark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  hue: number
  size: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let raf = 0
let running = false
let w = 0
let h = 0
const petals: Petal[] = []
const sparks: Spark[] = []
let burstAt = 0
const reduced =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function resize() {
  const c = canvasRef.value
  if (!c) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  w = window.innerWidth
  h = window.innerHeight
  c.width = Math.floor(w * dpr)
  c.height = Math.floor(h * dpr)
  c.style.width = `${w}px`
  c.style.height = `${h}px`
  const ctx = c.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

function spawnPetal() {
  petals.push({
    x: Math.random() * w,
    y: -20 - Math.random() * 80,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 1.2 + Math.random() * 2.2,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.12,
    size: 6 + Math.random() * 10,
    hue: 330 + Math.random() * 40,
    life: 1,
  })
}

function spawnBurst() {
  const cx = w * (0.15 + Math.random() * 0.7)
  const cy = h * (0.12 + Math.random() * 0.45)
  const hue = Math.floor(Math.random() * 360)
  const n = reduced ? 18 : 42
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.2
    const sp = 2.5 + Math.random() * 4.5
    sparks.push({
      x: cx,
      y: cy,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 1,
      max: 0.7 + Math.random() * 0.6,
      hue: hue + (Math.random() - 0.5) * 40,
      size: 2 + Math.random() * 2.5,
    })
  }
}

function tick() {
  if (!running) return
  raf = requestAnimationFrame(tick)
  const c = canvasRef.value
  const ctx = c?.getContext('2d')
  if (!ctx || !c) return

  ctx.clearRect(0, 0, w, h)

  const now = performance.now()
  if (now >= burstAt) {
    spawnBurst()
    burstAt = now + (reduced ? 900 : 520)
  }

  const petalCap = reduced ? 28 : 70
  while (petals.length < petalCap) spawnPetal()

  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]
    p.x += p.vx + Math.sin(p.y * 0.02) * 0.4
    p.y += p.vy
    p.rot += p.vr
    if (p.y > h + 40) {
      petals.splice(i, 1)
      continue
    }
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rot)
    ctx.fillStyle = `hsla(${p.hue}, 78%, 68%, 0.88)`
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size, p.size * 0.45, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]
    s.x += s.vx
    s.y += s.vy
    s.vy += 0.06
    s.vx *= 0.985
    s.life -= 0.016 / s.max
    if (s.life <= 0) {
      sparks.splice(i, 1)
      continue
    }
    ctx.beginPath()
    ctx.fillStyle = `hsla(${s.hue}, 95%, 62%, ${Math.max(0, s.life)})`
    ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2)
    ctx.fill()
  }
}

function start() {
  if (running) return
  running = true
  petals.length = 0
  sparks.length = 0
  resize()
  burstAt = performance.now()
  spawnBurst()
  raf = requestAnimationFrame(tick)
  window.addEventListener('resize', resize)
}

function stop() {
  running = false
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', resize)
  petals.length = 0
  sparks.length = 0
  const c = canvasRef.value
  const ctx = c?.getContext('2d')
  if (ctx && c) ctx.clearRect(0, 0, c.width, c.height)
}

watch(
  () => props.active,
  (v) => {
    if (v) start()
    else stop()
  },
)

onMounted(() => {
  if (props.active) start()
})

onBeforeUnmount(() => stop())
</script>

<style scoped>
.fx-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}
</style>
