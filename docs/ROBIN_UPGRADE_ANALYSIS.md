# Robin（知更鸟）升级 — 只读技术分析报告

| 项目 | 说明 |
|------|------|
| 范围 | 仅分析；**本轮未改任何代码** |
| 约束 | 只增强 `robin`；不破坏另五皮肤、DeepSeek 对话、库表偏好、本地部署与 `BASE_URL` |
| 日期 | 2026-03-21 |

---

## 0. 信息不足清单（必须先确认）

以下内容在本仓库中**不存在**或**无法从代码推断**，接入前需产品/运维补充：

| # | 缺口 | 说明 |
|---|------|------|
| 1 | **GPT-SoVITS** | 全库无 SoVITS / GPT-SoVITS 客户端、HTTP 封装、模型路径、API 约定。注释仅写「不改 Piper」。无法确认「已有 GPT-SoVITS」的部署位置、端口、推理协议（WebUI / API / CLI）。 |
| 2 | **sherpa-onnx** | 全库无 sherpa / onnxruntime 听写相关依赖与封装。现有 ASR 仅为浏览器 Web Speech。 |
| 3 | **少女专用声库 / 参考音频** | 仓库无 robin 专用 wav/reference。Piper 仅服务「英文听力」模块（`apps/api/src/listening/`），默认音色为英文 `en_GB-alba-medium`，**未接宠物**。 |
| 4 | **celebrate-bgm.mp3** | `public/audio/` 仅有 `README.txt` + `.gitkeep`，**无 mp3 文件**；运行时走 WebAudio 内置琶音回退。 |
| 5 | **节拍元数据** | 无 BPM / beat grid / 歌词时间轴；BGM 与舞蹈目前是**并行播放，非节拍同步**。 |
| 6 | **robin 独立 VRM** | 六皮肤均指向 `models/character.vrm`（约 18.8MB）。若要「少女形象」，需另备 VRM 或接受同模异文案。 |
| 7 | **Thinking.fbx 用途** | `public/animations/mixamo/Thinking.fbx` 存在，但 **src 中零引用**。 |
| 8 | **嘴型驱动数据** | 嘴型为程序 `sin` 驱动 `aa`，无 viseme / 音素时间戳。接 TTS 音频后若要口型同步，需另定方案（能量包络 / 音素对齐 / 模型输出）。 |

---

## 1. 当前技术架构分析

### 1.1 分层

```
业务页 (化学全对 / 错题 / 知识卡片)
    │ requestCelebration / emitPetEvent
    ▼
Pinia stores/pet.ts  ──偏好──► Nest pet-assistant (prefs/chat)
    │ celebrateSeq / action / bubble
    ▼
PetCompanion.vue（编排：听写、对话、庆祝、拖拽）
    ├── usePetWakeWord → Web Speech Recognition
    ├── usePetSpeech   → SpeechSynthesis
    ├── usePetCelebrateBgm → HTMLAudio / AudioContext
    ├── PetChatPanel → POST /pet-assistant/chat → DeepSeek
    └── PetAvatar → PetVrmCanvas → useVrmPet
              Three.js + @pixiv/three-vrm
              loadMixamoAnimation (仅庆祝舞蹈)
```

### 1.2 一、语音系统（现状）

#### TTS 如何调用

- 唯一宠物 TTS：`apps/web/src/composables/usePetSpeech.ts` → `window.speechSynthesis`。
- 入口：
  - `speakPet(text, { fromUserGesture?, onEnd? })`
  - `pushBubble` 默认 `speak !== false` 时调用 `speakPet`
  - AI 回复：`PetChatPanel` 在 `petChat` 成功后 `speakPet(res.reply)`
  - 庆祝：`runCelebration` 里 `speakPet(say, { fromUserGesture: true })`，气泡用 `speak: false` 避免双读
- 本机配置（localStorage）：`pet.speechEnabled` / `pet.speechVoiceURI` / `pet.speechRate` / `pet.speechPitch`。
- **与 Piper 无关**：Piper 仅 `listening` 模块合成英文 wav；宠物代码明确写「不改 Piper」。

#### ASR 如何调用

- `usePetWakeWord.ts`：`SpeechRecognition` / `webkitSpeechRecognition`，`lang=zh-CN`。
- 流程：点「听」→ `start()` → interim/final 缓冲 → 静音约 700ms 或再点「麦」`flush` → `handleText`（变身 / 唤醒词 / 直接提问）→ `onUserUtterance` → 开面板 `sendExternal`。
- **无服务端 ASR**；无 sherpa。

#### 自动播放限制

- TTS：模块级 `unlocked`；需用户手势内 `unlockPetSpeech()`（短发「嗯」）或 `fromUserGesture: true`。未解锁时异步 `speakPet` 直接失败并写 debug。
- BGM：`HTMLAudioElement.play()` / `AudioContext.resume()` 需手势；`onCelebrate` 与 `runCelebration` 均在点击或庆祝链上调用 `startCelebrateBgm`。
- 化学全对：`requestCelebration` 来自提交按钮点击链，一般已有手势；但路由跳转后若延迟过久，偶发 BGM/TTS 被拦（风险，见 §5）。

#### AI 回复如何触发朗读

1. 用户点发送 / 语音提交 → 同步 `unlockPetSpeech()`  
2. `POST /pet-assistant/chat`（DeepSeek `petChat`）  
3. 成功：`playAction('talk')` + `speakPet(reply, { onEnd → idle })`  
4. 失败：安慰动作 + `speakPet` 固定短句  

后端人设按 `skinId` 注入 `PET_SKIN_META`；**对话链路本身无需为 robin 改协议**，除非要传「情绪标签」给 TTS。

#### 是否存在重复播放

| 场景 | 风险 |
|------|------|
| 庆祝气泡 | 已 `speak: false`，再单独 `speakPet` → **设计正确** |
| `onCelebrate` | 先 `startCelebrateBgm()`，`runCelebration` 再 `startCelebrateBgm()`（内部先 `stop`）→ **重复启动但可工作** |
| `pushBubble` + 外部 `speakPet` | 若调用方未关 `speak`，会双读 |
| `emitPetEvent` 与 AI 回复重叠 | 可能抢同一 SpeechSynthesis（后者 cancel + 280ms 再播） |
| `unlock` 的「嗯」+ 正文 | 短促叠音，通常可接受 |
| 庆祝 TTS + BGM | 并行，非重复同一轨 |

#### 如何接入「已有」GPT-SoVITS / sherpa-onnx（在**仓库外存在**的前提下）

**前提**：当前仓库**没有**二者代码；下列为架构建议，非已有接口。

**GPT-SoVITS（建议后端代理，本地部署）**

```
前端 robin 专用 speakRobin(text)
  → POST /pet-assistant/tts  (新建，仅 JWT + 日限可选)
  → Nest 调本机 SoVITS HTTP/CLI
  → 返回 wav/ogg URL 或二进制
  → 前端 Audio 播放 + 可选口型能量分析
```

- 其他皮肤继续走 `speakPet`（SpeechSynthesis）。
- 路由分发：`speakPetOrRobin(text)` 内 `if (skinId==='robin' && robinTtsEnabled) … else speakPet`。
- **不要**改 DeepSeek `petChat` 本体；TTS 在回复之后异步合成。
- 需确认：SoVITS 服务地址、推理耗时、是否支持流式、参考音频路径、是否允许 Windows 服务同机部署。

**sherpa-onnx（建议可选本机 ASR）**

```
usePetWakeWord
  → 若 robin 且 sherpa 可用：MediaRecorder / AudioWorklet → 后端或 WASM 识别
  → 否则保持 Web Speech（现逻辑）
```

- 浏览器 WASM sherpa 体积大；更稳的是 Nest 侧麦克风流或「按住说话上传 pcm」。
- 与现有听写 UI（听/麦）可复用；`handleText` / 变身 / 唤醒词逻辑应复用。

### 1.3 二、角色动画（现状）

#### VRM 加载

- `PetVrmCanvas` `onMounted` → `useVrmPet({ url: resolveVrmUrl(vrmPath) })`  
- `GLTFLoader` + `VRMLoaderPlugin`；`VRMUtils.removeUnnecessaryVertices` / `combineSkeletons` / `rotateVRM0`  
- `skins.ts`：六皮肤 `vrm: 'models/character.vrm'`；换肤只换 accent/台词，**不换模型文件**（除非改 `vrm` 字段）

#### 表情控制

- `mapPetActionToVrm(action)` → `expressionManager.setValue(emotion, weight)`  
- 单击 `cycleExpression`：happy/surprised/angry/sad/relaxed/neutral 循环，hold ~1.8s  
- 无「情绪状态机」；无 robin 专属表情表

#### 嘴型

- 仅 `mouthTalk` 时对 `aa` 做 `sin` 开合；每帧先清零 `aa/ih/ou/ee/oh`  
- **无** 与真实音频对齐

#### Mixamo 重定向

- `loadMixamoAnimation.ts`：FBXLoader → 轨道按 `mixamoVRMRigMap` 绑到 `humanoid.getNormalizedBoneNode`；hips 高度缩放；VRM0 朝向处理  
- 仅 `playDance` 使用；默认 URL：`resolveVrmUrl('animations/mixamo/dance-hiphop.fbx')`

#### AnimationMixer

- 单 `mixer` + 单 `danceAction`；`clipAction` + `LoopOnce` + `clampWhenFinished`  
- `danceClip` 按 URL 缓存；换 URL 才重载  
- **不支持** 多 clip 交叉淡入淡出库（无 idle/walk/think 骨骼动画通道）  
- `Thinking.fbx` 未接入

#### 动画结束回 idle

- Mixer `finished` → `stopDance`（reset pose、特写镜头）→ `onEnd` → Companion `finishCelebration` → `playAction('idle')` + `closeCelebration`  
- 非舞蹈动作：Pinia `playAction` 用 `ACTION_DURATION_MS` 定时回 idle；`talk`/`think` 时长 0，靠 TTS `onEnd` 或关面板回 idle  
- FBX 失败：程序化 `applyCelebrateDance` + ~5.5s 后同样 `stopDance`

### 1.4 三、庆祝系统（现状）

#### `runCelebration` 流程

1. 停听写；`unlockPetSpeech`；`startCelebrateBgm`  
2. 气泡（不朗读）；`openCelebration`（body class、canvas 移入全屏宿主、全身镜头）  
3. `playAction('celebrate', 0)`；`speakPet`；`playDance({ onEnd: finishCelebration })`  
4. 兜底定时器：成功 30s / 失败 6.5s → `finishCelebration`  
5. `finishCelebration`：停 BGM、idle、`closeCelebration`、`celebrating=false`

#### BGM 与舞蹈同步

- **仅并行启动，无 BPM/节拍对齐**；内置音效 `setInterval(220ms)` 与 FBX 时长无关  
- 文件 BGM：`loop=true`，庆祝结束 `stopCelebrateBgm`

#### 资源重复加载

- FBX：同 URL 缓存在 `danceClip`；再次庆祝不重下  
- 换 VRM 会 `disposeModel` 清 mixer 与 clip  
- BGM：每次 `start` 用 `?t=Date.now()` 强刷，**故意不缓存**（便于替换文件）

#### 终止与卸载

- 正常：`finished` / 兜底 timer / `finishCelebration`  
- `PetCompanion.onBeforeUnmount`：清 timer、停 BGM、关庆祝、`stopPetSpeech`  
- `PetVrmCanvas.onBeforeUnmount`：`ctrl.dispose()`（停 RAF、dispose 模型/renderer）  
- **缺口**：卸载时未显式 `stopDance` 以外的 AudioContext 永久关闭（BGM 已 stop；ctx 可残留，影响小）

### 1.5 四、状态管理（现状）

#### Pinia 可复用

`skinId`、`petEnabled`、`action`、`celebrating`、`celebrateSeq`、`celebrateLine`、`bubble`、`listening`、`panelOpen`、`wakeWord`、`canUseAi`、`playAction` / `emitPetEvent` / `requestCelebration` / `pushBubble`

#### 建议 robin 新增（分析级，未实现）

| 状态 | 建议位置 | 理由 |
|------|----------|------|
| `robinEmotion` / `robinMood` | Pinia 或 robin composable | 情绪表现；勿污染全局 action 语义 |
| `robinTtsEnabled` / 引擎选择 | localStorage 或 prefs JSON 扩展 | 本机能力差异大 |
| `robinBeatSyncEnabled` | localStorage | 实验开关 |
| 当前播歌/舞曲 id | 内存即可 | 不需服务端 |
| 音频 Audio 实例句柄 | composable 模块变量 | 同现 BGM 模式 |

#### localStorage vs 服务端

| 配置 | 建议 |
|------|------|
| 语音开关/音色/语速/音调、BGM 开关音量、浮窗位置、镜头模式、欢迎日 | **继续 localStorage**（已有） |
| skinId、petEnabled、wakeWordOverrides | **继续服务端** `user_pet_prefs` |
| robin 专用 TTS 开关、舞蹈曲目偏好 | 优先 localStorage；若要多端同步再扩展 JSON 列或新列（**需迁移，非本轮必须**） |
| 日对话次数 | 已有 `pet_chat_daily`，勿破坏 |

**不要**为 robin 升级强制改表结构，除非要云端同步 TTS 偏好。

### 1.6 五、兼容性

#### 其他五皮肤不受影响

- 所有增强以 `skinId === 'robin'` 分支或 `getSkin(id).features?.robinEnhanced` 门控  
- 默认路径保持：SpeechSynthesis、现有 `emitPetEvent`、共用 `requestCelebration`  
- 勿改 `PET_SKIN_IDS` 删除项；勿改另五皮肤的 `scripts` / `personality`（可只追加 robin）

#### 化学训练全对

- `ChemistryTrainSessionView` → `requestCelebration` → `celebrateSeq` → `runCelebration`  
- 保持 `requestCelebration` 签名与 Companion watch 即可  
- robin 若换舞蹈/BGM，应在 `runCelebration` 内按皮肤选资源，**不要**改化学页判定逻辑

#### 二级目录

- 已有 `resolveVrmUrl` + `vite.config.ts` 的 `VITE_BASE`  
- 新资源必须走 `resolveVrmUrl('…')` 或等价 `BASE_URL` 拼接  
- 禁止写死 `/animations/...`、`/audio/...`

---

## 2. 可以直接复用的模块

| 模块 | 复用方式 |
|------|----------|
| `stores/pet.ts` | 庆祝触发、动作、气泡、偏好；扩展时加 robin 字段勿改旧 API |
| `requestCelebration` / `runCelebration` 骨架 | 换资源与 TTS 实现，保留编排顺序 |
| `useVrmPet` + `loadMixamoAnimation` | 继续作舞蹈引擎；扩展 `playDance({ url })` 即可多曲 |
| `resolveVrmUrl` | 所有新静态资源 |
| `PetChatPanel` + `petChat` + DeepSeek `petChat` | **不改协议**；仅在朗读层替换 robin TTS |
| `usePetWakeWord.handleText` | 变身/唤醒/提问语义 |
| `usePetCelebrateBgm` 模式 | 可抽「可循环 Audio + 回退」给 robin 曲库 |
| `event-map` / `vrm-action-map` / `scripts` | 事件短反馈；robin 可追加台词条目 |
| `PetCelebrationFx` | 全屏粒子可继续用 |
| `PetCompanionView` 设置页模式 | 增加「仅 robin」折叠项 |
| Nest `pet-assistant` prefs/chat | 对话与偏好；TTS 若代理则**新增**接口，不改 chat 语义 |
| `AiAccessService` / 日限模式 | 若 TTS 也耗资源可仿照日限 |

---

## 3. 必须新增的模块（建议）

> 名称供规划；本轮未创建。

| 建议路径 | 职责 |
|----------|------|
| `apps/web/src/composables/robin/useRobinTts.ts` | robin 少女声播放；失败回退 `speakPet` |
| `apps/web/src/composables/robin/useRobinLipSync.ts`（可选） | 音频能量 → `aa` 权重 |
| `apps/web/src/composables/robin/useRobinBeatSync.ts` | BPM/拍点；驱动动画速度或踩点表情（需元数据） |
| `apps/web/src/composables/robin/useRobinDancePlaylist.ts` | 曲目↔FBX↔BGM 映射 |
| `apps/web/src/components/pet/robin/robin-config.ts` | 功能开关、默认资源路径、情绪表 |
| `apps/web/public/pet/robin/**` | 专属音频/（可选）VRM/动画 |
| （若本机 SoVITS）`apps/api/src/pet-assistant/robin-tts.*` | 本地代理，非云 API |
| （若 sherpa）`apps/api/...` 或 `public/wasm/...` | 本地 ASR；二选一方案需另立 |

**不建议** 把 SoVITS/sherpa 直接塞进浏览器主包而无 feature 检测与回退。

---

## 4. 需要修改的现有文件（实施阶段，非本轮）

| 文件 | 改动性质 | 风险控制 |
|------|----------|----------|
| `skins.ts` | robin 可改独立 `vrm`；可选 `capabilities` 字段 | 另五皮肤保持 `DEFAULT_VRM` |
| `scripts.ts` | 仅丰富 `robin` 台词 / 新事件文案 | 勿改其他 skin 键 |
| `usePetSpeech.ts` 或薄封装 | 导出 `speakPetSmart` 按皮肤分流 | 默认行为不变 |
| `PetCompanion.vue` | `runCelebration` 内 robin 选曲/选 TTS；卸载释放 robin Audio | 非 robin 走旧路径 |
| `PetChatPanel.vue` | 回复朗读走 smart TTS | DeepSeek 调用不变 |
| `stores/pet.ts` | 可选 robin 情绪；`pushBubble` 对 robin 走新 TTS | 节流逻辑保留 |
| `useVrmPet.ts` | 多 clip 注册、可选 playbackRate 踩点；口型外部 API | 保持单 mixer 兼容 |
| `loadMixamoAnimation.ts` | 基本可不动；多 URL 调用即可 | — |
| `usePetCelebrateBgm.ts` 或旁路 | robin 专用曲目 URL | 全局庆祝回退保留 |
| `event-map.ts` / `vrm-action-map.ts` | 仅当新增 PetAction 时扩展 | 旧 action 兼容 |
| `PetCompanionView.vue` | robin 设置项 | 非 robin 隐藏 |
| `pet-assistant`（可选） | 新 TTS 代理路由；**不改** chat DTO 语义 | 库表尽量不动 |
| `deepseek-client.service.ts` | **尽量不改**；若要情绪标签可在 system 追加一行且仅 robin personality | 避免影响全局 JSON 业务 |
| `ChemistryTrainSessionView.vue` | **建议不改** | 已接 `requestCelebration` |
| `vite.config.ts` / `package.json` | 仅当引入 WASM/新依赖时 | 先论证体积 |

---

## 5. 潜在风险

1. **自动播放**：化学提交后跳转结果页，TTS/BGM 可能丢手势上下文。  
2. **SoVITS 延迟**：首包数秒会让嘴型与气泡不同步；需 loading 态与回退浏览器 TTS。  
3. **单 Mixer**：未做动作队列时，庆祝与 think 骨骼动画会互相 `stopAllAction`。  
4. **共用 VRM**：换 robin 模型后，Mixamo 重定向需回归；失败已有程序化兜底。  
5. **包体**：VRM 18MB + 多 FBX + 曲库；二级目录 CDN/nginx 超时。  
6. **双 BGM 启动**：`onCelebrate` 与 `runCelebration` 重复调用，需整理避免竞态。  
7. **日限与算力**：本机 TTS 若无配额可能打满 CPU；应独立限流。  
8. **破坏偏好**：扩展 `wake_word_overrides` 外字段需迁移；优先不改表。  
9. **「少女声」用 SpeechSynthesis 提 pitch**：现有 pitch 滑杆可临时模拟，但非真声库，且影响所有皮肤若未门控。  
10. **无节拍数据时宣称「节拍同步」**：只能做假同步（固定 playbackRate），需在需求中降级表述。

---

## 6. 分阶段实施计划（建议）

### Phase 0 — 澄清（0.5–1 天）

- 确认 SoVITS / sherpa 是否本机已装、协议与路径  
- 确认是否提供独立 robin VRM、曲库、BPM  
- 验收标准：仅 robin 有新能力；另五皮肤录屏无回归；化学全对仍庆祝；`VITE_BASE=/study-system/` 资源 200  

### Phase 1 — 皮肤门控 + 资源位（小改）

- `skins.ts`：robin 可选独立资源字段  
- `public/pet/robin/` 放下音频/动画占位  
- Companion / Chat 增加 `isRobin` 分支空壳（仍调旧 TTS）  

### Phase 2 — 少女声 TTS（核心）

- 实现 `useRobinTts` + 回退 `speakPet`  
- 若有 SoVITS：Nest 本地代理；无则先用**预合成 wav 文案库**或本机 Piper 中文模型（若运维提供）— **不调用收费云**  
- 接通 Chat 回复与庆祝台词  

### Phase 3 — 情绪表现

- robin 情绪表 → Expression 权重  
- 事件 / AI 简单情绪启发式（关键词）  
- 可选唇形：音频 AnalyserNode  

### Phase 4 — 音乐舞蹈增强

- 多 FBX 播放列表（含接入闲置的 `Thinking.fbx`）  
- robin 庆祝选曲；BGM 与舞同步启动  
- 有 BPM 再做 `playbackRate` / 拍点表情；无则文档标明「并行播放」  

### Phase 5 — ASR 增强（可选）

- 仅 robin 尝试 sherpa；失败回退 Web Speech  

### Phase 6 — 设置与发布

- 设置页 robin 开关、试听  
- 发布清单：资源进 pack、nginx 静态、回归五皮肤 + 化学全对  

---

## 7. 推荐的文件目录结构

```
apps/web/public/
  models/
    character.vrm                 # 现有共用（保留）
    robin/                        # 可选：robin 专用 VRM
      character.vrm
  animations/mixamo/
    dance-hiphop.fbx              # 现有
    Thinking.fbx                  # 已有未用，可纳入 robin 思考态
  audio/
    celebrate-bgm.mp3             # 可选全局庆祝（目前缺失）
  pet/robin/
    voice/                        # 预合成或缓存 wav（若不用实时 SoVITS）
    bgm/                          # robin 曲库
    dances/                       # 可选额外 FBX
    meta/
      tracks.json                 # id, bgm, fbx, bpm?, offsetMs?

apps/web/src/
  components/pet/
    robin/
      robin-config.ts
      RobinSettingsBlock.vue      # 嵌入设置页，v-if robin
    …现有组件保持…
  composables/
    robin/
      useRobinTts.ts
      useRobinLipSync.ts
      useRobinBeatSync.ts
      useRobinDancePlaylist.ts
    usePetSpeech.ts               # 保留；供非 robin 与回退
    useVrmPet.ts                  # 扩展而非分叉整文件

apps/api/src/pet-assistant/
  …现有 prefs/chat 不动语义…
  robin-tts.controller.ts         # 仅当确认本机 SoVITS 时
  robin-tts.service.ts
```

---

## 附录 A — 仓库内已核实资源

| 资源 | 状态 |
|------|------|
| `public/models/character.vrm` | 存在 (~18.8MB)，六皮肤共用 |
| `public/animations/mixamo/dance-hiphop.fbx` | 存在，代码默认舞蹈 |
| `public/animations/mixamo/Thinking.fbx` | 存在，**未引用** |
| `public/audio/celebrate-bgm.mp3` | **不存在**（仅 README） |
| `public/pet/robin.png` / `trex.png` | 存在（预览图，非 VRM） |
| GPT-SoVITS / sherpa-onnx | **仓库内不存在** |
| Piper | 仅英文听力，非宠物 |

## 附录 B — 关键调用链速查

- TTS：`speakPet` ← `pushBubble` / `PetChatPanel` / `runCelebration` / 试听  
- ASR：`usePetWakeWord.toggle` ← Companion「听」  
- 庆祝：`requestCelebration` ← 化学全对 / 「贺」 ← `celebrateSeq` watch ← `runCelebration`  
- 舞蹈：`playDance` ← `loadMixamoAnimation` ← Mixer `finished` ← `finishCelebration`  
- AI：`petChat` API ← `PetAssistantService.chat` ← `DeepseekClientService.petChat`  

---

**结论**：现有 PetCompanion 已具备「事件反馈 + 全屏庆祝 + Mixamo 单曲舞蹈 + 浏览器语音 + DeepSeek 人设对话」完整骨架；robin 升级应采用 **皮肤门控 + 旁路 composable + 可选本地 TTS 代理**，而非重写宠物模块。在 SoVITS/sherpa/曲库/BPM/独立 VRM 未澄清前，不应进入大规模编码；本轮分析到此为止，**未修改任何代码**。
