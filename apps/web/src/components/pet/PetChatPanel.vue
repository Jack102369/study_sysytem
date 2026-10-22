<template>
  <div class="panel">
    <div class="head">
      <span>{{ skinName }}</span>
      <div class="head-actions">
        <el-button text size="small" @click="showSkins = !showSkins">换装</el-button>
        <el-button text size="small" @click="$emit('close')">关闭</el-button>
      </div>
    </div>

    <PetSkinPicker
      v-if="showSkins"
      :model-value="skinId"
      class="skins"
      @update:model-value="onPickSkin"
    />

    <div ref="listEl" class="messages">
      <div v-if="!messages.length" class="hint">
        跟我说说话吧～也可以说「变身为霸王龙」。主动互动不耗 AI；点发送才会调用对话。
      </div>
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="msg"
        :class="m.role"
      >
        {{ m.content }}
      </div>
      <div v-if="sending" class="msg assistant muted">思考中…</div>
    </div>

    <div v-if="!canUseAi" class="no-ai">
      未开通 AI 权限，可换装与看鼓励气泡；对话请联系管理员开通。
    </div>

    <div class="composer">
      <el-input
        v-model="draft"
        type="textarea"
        :rows="2"
        maxlength="500"
        placeholder="输入消息…"
        :disabled="sending || !canUseAi"
        @keydown.enter.exact.prevent="send"
      />
      <el-button type="primary" :loading="sending" :disabled="!canUseAi" @click="send">
        发送
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { petChat } from '@/api/pet-assistant'
import errMsg from '@/utils/err-msg'
import type { PetSkinId } from './skins'
import PetSkinPicker from './PetSkinPicker.vue'
import { usePetStore } from '@/stores/pet'
import { useRoute } from 'vue-router'
import { speakPet, unlockPetSpeech } from '@/composables/usePetSpeech'

const props = defineProps<{
  skinId: PetSkinId
  skinName: string
  canUseAi: boolean
}>()

defineEmits<{ close: [] }>()

const pet = usePetStore()
const route = useRoute()
const draft = ref('')
const sending = ref(false)
const showSkins = ref(false)
const listEl = ref<HTMLElement | null>(null)
const messages = ref<Array<{ role: 'user' | 'assistant'; content: string }>>([])

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    if (listEl.value) listEl.value.scrollTop = listEl.value.scrollHeight
  },
)

async function onPickSkin(id: PetSkinId) {
  await pet.setSkin(id)
  showSkins.value = false
}

async function sendExternal(text: string) {
  draft.value = text
  await send()
}

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  if (!props.canUseAi) {
    ElMessage.warning('未开通 AI 权限，无法对话')
    return
  }
  // 同步手势：解锁语音（AI 返回后才能继续朗读）
  unlockPetSpeech()
  draft.value = ''
  messages.value.push({ role: 'user', content: text })
  sending.value = true
  pet.playAction('think')
  try {
    const history = messages.value.slice(0, -1).slice(-10)
    const res = await petChat({
      message: text,
      history,
      skinId: props.skinId,
      context: `页面路径 ${route.path}`,
    })
    messages.value.push({ role: 'assistant', content: res.reply })
    pet.playAction('talk')
    // 点击发送时已 unlock；此处为异步回复，依赖页面已激活
    speakPet(res.reply, {
      onEnd: () => {
        if (pet.action === 'talk') pet.playAction('idle')
      },
    })
  } catch (e) {
    ElMessage.error(errMsg(e, '对话失败'))
    pet.playAction('comfort')
    speakPet('抱歉，刚才没说清楚，再试一次好吗？')
  } finally {
    sending.value = false
  }
}

defineExpose({ sendExternal })
</script>

<style scoped>
.panel {
  width: min(320px, calc(100vw - 24px));
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid var(--el-border-color-lighter, #e5e5e5);
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f0f0f0);
}
.head-actions {
  display: flex;
  gap: 0;
}
.skins {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f0f0f0);
}
.messages {
  height: 220px;
  overflow: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hint {
  font-size: 12px;
  opacity: 0.65;
  line-height: 1.5;
}
.msg {
  max-width: 90%;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.user {
  align-self: flex-end;
  background: var(--el-color-primary-light-7, #d9ecff);
}
.msg.assistant {
  align-self: flex-start;
  background: var(--el-fill-color-light, #f5f5f5);
}
.msg.muted {
  opacity: 0.7;
}
.no-ai {
  padding: 6px 12px;
  font-size: 12px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, #fdf6ec);
}
.composer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--el-border-color-extra-light, #f0f0f0);
  align-items: flex-end;
}
</style>
