<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed, onMounted, ref } from 'vue'
import { cn } from '@/utils/cn'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    slotClass?: HTMLAttributes['class']
    gradientSize?: number
    gradientColor?: string
    gradientOpacity?: number
  }>(),
  {
    class: '',
    slotClass: '',
    gradientSize: 220,
    gradientColor: 'rgba(96, 165, 250, 0.22)',
    gradientOpacity: 0.9,
  },
)

const mouseX = ref(-props.gradientSize * 10)
const mouseY = ref(-props.gradientSize * 10)

function handleMouseMove(e: MouseEvent) {
  const target = e.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

function handleMouseLeave() {
  mouseX.value = -props.gradientSize * 10
  mouseY.value = -props.gradientSize * 10
}

onMounted(() => {
  mouseX.value = -props.gradientSize * 10
  mouseY.value = -props.gradientSize * 10
})

const backgroundStyle = computed(
  () =>
    `radial-gradient(circle ${props.gradientSize}px at ${mouseX.value}px ${mouseY.value}px, ${props.gradientColor} 0%, transparent 70%)`,
)
</script>

<template>
  <div
    :class="
      cn(
        'group relative overflow-hidden rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-card-bg)] text-[var(--app-text)]',
        props.class,
      )
    "
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      :style="{ background: backgroundStyle, opacity: gradientOpacity }"
    />
    <div :class="cn('relative z-10', props.slotClass)">
      <slot />
    </div>
  </div>
</template>
