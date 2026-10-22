<template>
  <div v-loading="loading">
    <div class="toolbar">
      <h1>学习伙伴</h1>
    </div>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="右下角 3D 伙伴：问候/鼓励/AI 回复会用本机语音朗读（浏览器 TTS，非 Piper）。可关语音。侧栏「聊」打开 Deepseek；可语音「变身为霸王龙」。"
      style="margin-bottom: 16px"
    />

    <el-form label-width="120px" style="max-width: 560px">
      <el-form-item label="显示伙伴">
        <el-switch v-model="petEnabled" @change="onToggle" />
      </el-form-item>
      <el-form-item label="语音朗读">
        <el-switch v-model="speechEnabled" @change="onSpeechToggle" />
        <el-button style="margin-left: 12px" size="small" @click="onTestSpeech">试听</el-button>
        <div class="hint">
          用浏览器朗读（非 Piper）。需先点一次页面按钮解锁；Windows 请安装「中文语音包」。
          <br />
          状态：{{ speechDebug }}
        </div>
      </el-form-item>
      <el-form-item label="朗读音色">
        <el-select
          v-model="voiceURI"
          filterable
          clearable
          placeholder="系统默认中文音色"
          style="max-width: 360px"
          :disabled="!speechEnabled"
          @change="onVoiceChange"
        >
          <el-option
            v-for="v in voiceOptions"
            :key="v.voiceURI"
            :label="voiceLabel(v)"
            :value="v.voiceURI"
          />
        </el-select>
        <div class="hint">
          浏览器只能使用「本机已安装」的语音包，不能上传自定义声库（与 Piper 无关）。
          <br />
          添加更多音色：Windows「设置 → 时间和语言 → 语音 → 管理语音」安装中文语音后刷新本页，再在上方下拉选择。
        </div>
      </el-form-item>
      <el-form-item label="语速">
        <el-slider
          v-model="speechRate"
          :min="0.7"
          :max="1.6"
          :step="0.05"
          :disabled="!speechEnabled"
          style="max-width: 280px"
          show-input
          @change="onRateChange"
        />
      </el-form-item>
      <el-form-item label="音调">
        <el-slider
          v-model="speechPitch"
          :min="0.6"
          :max="1.6"
          :step="0.05"
          :disabled="!speechEnabled"
          style="max-width: 280px"
          show-input
          @change="onPitchChange"
        />
        <div class="hint">调高音调更偏「少女感」，调低更沉稳；改完可点试听。</div>
      </el-form-item>
      <el-form-item label="祝贺音乐">
        <el-switch v-model="bgmEnabled" @change="onBgmToggle" />
        <el-button style="margin-left: 12px" size="small" @click="onTestBgm">试听</el-button>
        <div class="hint">
          点「贺」跳舞时播放。默认内置轻快音效；也可把自定义文件放到
          <code>apps/web/public/audio/celebrate-bgm.mp3</code>。
          <br />
          {{ bgmDebug }}
        </div>
      </el-form-item>
      <el-form-item label="祝贺音量">
        <el-slider
          v-model="bgmVolume"
          :min="0"
          :max="1"
          :step="0.05"
          :disabled="!bgmEnabled"
          style="max-width: 280px"
          show-input
          @change="onBgmVolumeChange"
        />
      </el-form-item>
      <el-form-item label="当前形象">
        <PetSkinPicker v-model="skinId" @update:model-value="onSkin" />
      </el-form-item>
      <el-form-item label="唤醒词">
        <el-input
          v-model="wakeWord"
          :placeholder="defaultWake"
          maxlength="32"
          style="max-width: 240px"
        />
        <el-button style="margin-left: 8px" :loading="saving" @click="onSaveWake">
          保存唤醒词
        </el-button>
        <div class="hint">仅作用于当前形象；留空并保存可恢复默认「{{ defaultWake }}」</div>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import PetSkinPicker from '@/components/pet/PetSkinPicker.vue'
import { getSkin, type PetSkinId } from '@/components/pet/skins'
import { usePetStore } from '@/stores/pet'
import {
  getPetSpeechDebug,
  getPetSpeechPitch,
  getPetSpeechRate,
  getSavedVoiceURI,
  initPetSpeech,
  isPetSpeechEnabled,
  isPetSpeechSupported,
  listPetVoices,
  setPetSpeechEnabled,
  setPetSpeechPitch,
  setPetSpeechRate,
  setPreferredVoiceURI,
  speakPet,
} from '@/composables/usePetSpeech'
import {
  getCelebrateBgmDebug,
  getCelebrateBgmVolume,
  isCelebrateBgmEnabled,
  setCelebrateBgmEnabled,
  setCelebrateBgmVolume,
  startCelebrateBgm,
  stopCelebrateBgm,
} from '@/composables/usePetCelebrateBgm'
import errMsg from '@/utils/err-msg'

const pet = usePetStore()
const loading = ref(false)
const saving = ref(false)
const petEnabled = ref(true)
const speechEnabled = ref(isPetSpeechEnabled())
const speechDebug = ref('')
const skinId = ref<PetSkinId>('robin')
const wakeWord = ref('')
const voiceURI = ref(getSavedVoiceURI())
const voiceOptions = ref<SpeechSynthesisVoice[]>([])
const speechRate = ref(getPetSpeechRate())
const speechPitch = ref(getPetSpeechPitch())
const bgmEnabled = ref(isCelebrateBgmEnabled())
const bgmVolume = ref(getCelebrateBgmVolume())
const bgmDebug = ref('')

const defaultWake = computed(() => getSkin(skinId.value).defaultWakeWord)

function voiceLabel(v: SpeechSynthesisVoice) {
  const local = v.localService ? '本地' : '在线'
  return `${v.name}（${v.lang} · ${local}）`
}

function refreshVoices() {
  initPetSpeech()
  voiceOptions.value = listPetVoices()
  const saved = getSavedVoiceURI()
  if (saved && voiceOptions.value.some((v) => v.voiceURI === saved)) {
    voiceURI.value = saved
  }
  speechDebug.value = getPetSpeechDebug()
}

function onVoiceChange(uri: string) {
  setPreferredVoiceURI(uri || '')
  speechDebug.value = getPetSpeechDebug()
  ElMessage.success(uri ? '已切换音色，可点试听' : '已恢复默认中文音色')
}

function onRateChange(v: number | number[]) {
  const n = Array.isArray(v) ? v[0] : v
  setPetSpeechRate(n)
  speechDebug.value = getPetSpeechDebug()
}

function onPitchChange(v: number | number[]) {
  const n = Array.isArray(v) ? v[0] : v
  setPetSpeechPitch(n)
  speechDebug.value = getPetSpeechDebug()
}

function onBgmToggle(v: string | number | boolean) {
  setCelebrateBgmEnabled(!!v)
  bgmDebug.value = getCelebrateBgmDebug()
  if (!v) stopCelebrateBgm()
  ElMessage.success(v ? '已开启祝贺音乐' : '已关闭祝贺音乐')
}

function onBgmVolumeChange(v: number | number[]) {
  const n = Array.isArray(v) ? v[0] : v
  setCelebrateBgmVolume(n)
  bgmDebug.value = getCelebrateBgmDebug()
}

async function onTestBgm() {
  setCelebrateBgmEnabled(true)
  bgmEnabled.value = true
  await startCelebrateBgm()
  bgmDebug.value = getCelebrateBgmDebug()
  ElMessage.success('正在试听祝贺音乐（约 3 秒）…')
  setTimeout(() => {
    stopCelebrateBgm()
    bgmDebug.value = getCelebrateBgmDebug()
  }, 3200)
}

watch(
  () => pet.skinId,
  (id) => {
    skinId.value = id
    wakeWord.value = pet.wakeWordOverrides[id] || ''
  },
)

async function load() {
  loading.value = true
  try {
    await pet.loadPrefs()
    petEnabled.value = pet.petEnabled
    skinId.value = pet.skinId
    wakeWord.value = pet.wakeWordOverrides[pet.skinId] || ''
  } catch (e) {
    ElMessage.error(errMsg(e, '加载失败'))
  } finally {
    loading.value = false
  }
}

async function onToggle(v: string | number | boolean) {
  try {
    await pet.setPetEnabled(!!v)
    ElMessage.success(v ? '已显示伙伴' : '已隐藏伙伴')
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  }
}

function onSpeechToggle(v: string | number | boolean) {
  setPetSpeechEnabled(!!v)
  speechDebug.value = getPetSpeechDebug()
  ElMessage.success(v ? '已开启语音朗读' : '已关闭语音朗读')
}

function onTestSpeech() {
  if (!isPetSpeechSupported()) {
    ElMessage.error('当前浏览器不支持语音朗读')
    return
  }
  setPetSpeechEnabled(true)
  speechEnabled.value = true
  // 必须在点击同步栈里 speak，不能先 cancel 再延时
  const ok = speakPet('你好，我是你的学习伙伴，可以听到我说话吗？', {
    fromUserGesture: true,
  })
  speechDebug.value = getPetSpeechDebug()
  if (ok) ElMessage.success('正在试听…请调大系统音量；若仍无声请安装中文语音包')
  else ElMessage.warning('未能开始朗读：' + getPetSpeechDebug())
}

async function onSkin(id: PetSkinId) {
  try {
    await pet.setSkin(id)
    wakeWord.value = pet.wakeWordOverrides[id] || ''
    ElMessage.success(`已切换为${getSkin(id).name}`)
  } catch (e) {
    ElMessage.error(errMsg(e, '切换失败'))
  }
}

async function onSaveWake() {
  saving.value = true
  try {
    await pet.setWakeWordForCurrent(wakeWord.value.trim())
    ElMessage.success('唤醒词已保存')
  } catch (e) {
    ElMessage.error(errMsg(e, '保存失败'))
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await load()
  refreshVoices()
  bgmDebug.value = getCelebrateBgmDebug()
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
  }
})

onBeforeUnmount(() => {
  stopCelebrateBgm()
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.removeEventListener('voiceschanged', refreshVoices)
  }
})

watch(speechEnabled, () => {
  speechDebug.value = getPetSpeechDebug()
})
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.toolbar h1 {
  margin: 0;
  font-size: 20px;
}
.hint {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.65;
}
</style>
