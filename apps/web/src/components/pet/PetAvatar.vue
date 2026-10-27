<template>
  <div class="avatar" :data-skin="skinId" :data-action="action" :style="{ '--accent': accent }">
    <PetVrmCanvas
      ref="vrmRef"
      class="stage"
      :vrm-path="vrmPath"
      :action="action"
      @ready="onReady"
      @error="onError"
      @hide="onHide"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getSkin, type PetSkinId } from './skins'
import type { PetAction } from './event-map'
import PetVrmCanvas from './PetVrmCanvas.vue'

const props = defineProps<{
  skinId: PetSkinId
  action: PetAction
}>()

const emit = defineEmits<{
  hide: []
}>()

const vrmRef = ref<{
  cycleExpression: () => void
  cycleCameraMode: () => void
  openExpand: () => void
  openCelebration: () => Promise<void> | void
  closeCelebration: () => void
  playDance: (opts?: { url?: string; onEnd?: () => void }) => Promise<boolean>
  stopDance: () => void
} | null>(null)
const accent = computed(() => getSkin(props.skinId).accent)
const vrmPath = computed(() => getSkin(props.skinId).vrm)

function onReady() {}

function onError(msg: string) {
  console.warn('[PetAvatar] VRM error:', msg)
}

function onHide() {
  emit('hide')
}

function cycleExpression() {
  vrmRef.value?.cycleExpression()
}

function cycleCameraMode() {
  vrmRef.value?.cycleCameraMode()
}

function openExpand() {
  vrmRef.value?.openExpand()
}

async function openCelebration() {
  await vrmRef.value?.openCelebration()
}

function closeCelebration() {
  vrmRef.value?.closeCelebration()
}

async function playDance(opts?: { url?: string; onEnd?: () => void }) {
  return (await vrmRef.value?.playDance(opts)) ?? false
}

function stopDance() {
  vrmRef.value?.stopDance()
}

defineExpose({
  cycleExpression,
  cycleCameraMode,
  openExpand,
  openCelebration,
  closeCelebration,
  playDance,
  stopDance,
})
</script>

<style scoped>
.avatar {
  width: 200px;
  height: 300px;
  background: transparent !important;
  overflow: visible;
  box-shadow: none;
}
.stage {
  width: 100%;
  height: 100%;
}

@media (max-width: 640px) {
  .avatar {
    width: 160px;
    height: 240px;
  }
}
</style>
