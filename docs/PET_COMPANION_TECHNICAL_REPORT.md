# 学习系统 · 电子宠物（学习伙伴）技术报告

| 项目 | 说明 |
|------|------|
| 文档版本 | 1.0 |
| 适用仓库 | `study_sysytem` |
| 模块名 | 前端：`PetCompanion` / 后端：`pet-assistant` |
| 撰写日期 | 2026-03-21 |

---

## 1. 概述

电子宠物（产品侧常称「学习伙伴」）是挂载在学习系统主布局上的**全局浮层陪伴组件**：以 **VRM 3D 角色** 呈现，结合 **表情驱动、语音听写/朗读、AI 多轮对话、学习事件反馈、全屏庆祝舞蹈** 等能力，在刷错题、化学训练、知识卡片等场景中提供鼓励与陪伴。

设计原则：

- **可选开启**：用户可关闭显示；未开通 AI 权限时仍可换装、看气泡、听本地语音，但不可调用云端对话。
- **数据按用户隔离**：偏好与日对话次数均绑定 `user_id`。
- **尽量少依赖**：3D 用 Three.js + `@pixiv/three-vrm`；语音用浏览器 Web Speech API；AI 复用现有 DeepSeek 客户端，不引入 Piper 等本地 TTS 依赖。
- **二级目录可部署**：静态资源（VRM / FBX / BGM）经 `resolveVrmUrl` 适配 `BASE_URL`（如 `/study-system/`）。

---

## 2. 功能清单（现状）

### 2.1 展示与交互

| 功能 | 说明 |
|------|------|
| 全局浮窗 | 登录后主布局 `AppLayout` 常驻挂载 `PetCompanion`，默认靠右下角 |
| 拖拽定位 | 按住角色区域拖动；位置写入 `localStorage`（`pet.position`） |
| 显示开关 | 偏好 `petEnabled`；关闭后不渲染浮层 |
| 气泡文案 | 问候、鼓励、听写提示等短句气泡（约 4.2s 自动消失） |
| 单击表情 | 单击角色循环 VRM Expression（开心→惊讶→生气→难过→放松→中性） |
| 双击镜头 | 双击切换相机取景模式（全身 / 半身等，见 `PetCameraController`） |
| 侧栏工具 | 「听」「聊」「音」「贺」四个快捷按钮 |

### 2.2 形象（皮肤）系统

| 功能 | 说明 |
|------|------|
| 六套人设 | 知更鸟、霸王龙、小狐、团子熊、夜猫、智鸮（`robin` / `trex` / `fox` / `panda` / `cat` / `owl`） |
| 人设差异 | 默认唤醒词、语音变身别名、强调色、AI 人设文案、事件台词表均不同 |
| 3D 模型 | 当前六套皮肤**共用**同一 VRM 文件 `models/character.vrm`（人设以文案/表情为主，非多模型） |
| 换装入口 | 对话面板「换装」、设置页「学习伙伴」、语音「变身为霸王龙」等 |
| 偏好同步 | `skinId` 持久化到服务端 `user_pet_prefs` |

### 2.3 语音能力

| 能力 | 技术 | 说明 |
|------|------|------|
| 听写（ASR） | Web Speech Recognition（`SpeechRecognition` / `webkitSpeechRecognition`） | 中文 `zh-CN`；推荐 Chrome / Edge |
| 唤醒词 | 自定义（按皮肤覆盖） | 说唤醒词后再提问；也可直接说完整问题；面板已开时直接当问题 |
| 变身口令 | 正则解析「变身为 / 变成 / 切换成 / 换成 + 名称」 | 匹配别名则换肤；不匹配则气泡提示可选形象列表 |
| 朗读（TTS） | Web Speech Synthesis | **非 Piper**；需用户手势解锁（防自动播放策略） |
| 音色 / 语速 / 音调 | 设置页可配 | 仅本机已安装语音包；存 `localStorage` |
| 试听 | 「音」按钮 / 设置页试听 | 同步手势内调用，保证可播 |

限制与注意：

- Chrome 听写多为云端识别，需网络；拒绝麦克风会气泡提示。
- 未安装中文语音包时 TTS 可能无声或英文腔，设置页有调试状态串。

### 2.4 AI 对话

| 功能 | 说明 |
|------|------|
| 文字对话 | `PetChatPanel` 多轮聊天，Enter / 发送 |
| 语音提问 | 「听」听写结束后自动打开对话并 `sendExternal` |
| 人设提示词 | 后端按皮肤注入 personality，要求中文短句、≤80 字风格、不编造成绩 |
| 上下文 | 前端附带当前 `route.path` 作为 `context` |
| 历史 | 最多回传近 10 轮；单条消息前端 500 / 后端校验 1000 字 |
| 权限 | `AiAccessService.assertCanUseAi`；无权限仅换装与本地气泡 |
| 日限 | `PET_CHAT_DAILY_LIMIT`（默认 40），表 `pet_chat_daily` 按日累计 |

### 2.5 学习事件驱动反馈

业务页通过 Pinia `emitPetEvent` 触发**短反馈**（表情动作 + 气泡 + 可选 TTS），有约 **30s 同事件节流**（`welcome` / `transform` 除外）：

| 事件 | 典型触发场景 | 默认动作 |
|------|--------------|----------|
| `welcome` | 每日首次加载伙伴 | `greet` |
| `attempt_correct` | 错题详情判对 | `cheer` |
| `attempt_wrong` | 错题详情判错 | `comfort` |
| `mastered` | （脚本已备，业务可接） | `roar` |
| `reward_unlock` | （脚本已备） | `cheer` |
| `knowledge_saved` | 知识卡片保存 | `nod` |
| `transform` | 换肤成功 | `transform` |

说明：错题场景的 `attempt_correct` 目前是**短庆祝（cheer）**，不是全屏跳舞。

### 2.6 全屏祝贺（Celebrate）

完整编排由 `PetCompanion.runCelebration` 执行：

1. 停听写、解锁 TTS、播放祝贺 BGM  
2. 全屏放大角色（`openCelebration`）+ Canvas 2D **花瓣 / 烟花**（`PetCelebrationFx`）  
3. 动作切 `celebrate`，TTS 朗读祝贺语  
4. **Mixamo FBX** 重定向到 VRM Humanoid 播放舞蹈（默认 `animations/mixamo/dance-hiphop.fbx`）  
5. 舞蹈结束或兜底超时（成功约 30s / 失败约 6.5s）后复位镜头、停 BGM、回 idle  

触发入口：

| 入口 | 说明 |
|------|------|
| 侧栏「贺」 | 手动试玩 |
| `pet.requestCelebration({ line })` | 业务调用 API |
| **化学训练整套全对** | `ChemistryTrainSessionView` 提交后：`wrongCount=0` 且 `pendingCount=0` 且 `correctCount === actualCount` |

祝贺 BGM：默认 `public/audio/celebrate-bgm.mp3`，设置页可关 / 调音量；同样走 `resolveVrmUrl`。

### 2.7 设置页

路由：`/settings/pet`（「学习伙伴」）

- 显示伙伴开关  
- 语音朗读开关、音色、语速、音调、试听与调试信息  
- 祝贺音乐开关与音量  
- 形象选择  
- 当前形象唤醒词保存（空则恢复默认）

---

## 3. 技术架构

### 3.1 总体结构

```
┌─────────────────────────────────────────────────────────────┐
│  AppLayout.vue                                              │
│    └── PetCompanion.vue（全局浮层编排）                        │
│          ├── PetBubble / PetChatPanel / PetSkinPicker         │
│          ├── PetAvatar → PetVrmCanvas → useVrmPet            │
│          │     ├── Three.js WebGL + @pixiv/three-vrm         │
│          │     ├── Expression / 眨眼 / 相机 Tween              │
│          │     └── Mixamo FBX → VRM 骨骼重定向舞蹈            │
│          ├── usePetWakeWord（Web Speech Recognition）        │
│          ├── usePetSpeech（SpeechSynthesis）                 │
│          └── usePetCelebrateBgm + PetCelebrationFx           │
│                                                             │
│  Pinia stores/pet.ts  ←→  @/api/pet-assistant.ts            │
└───────────────────────────────┬─────────────────────────────┘
                                │ JWT HTTP
┌───────────────────────────────▼─────────────────────────────┐
│  NestJS PetAssistantModule                                    │
│    Controller: GET/PATCH prefs, POST chat                     │
│    Service: 偏好 CRUD、日限、DeepseekClient.petChat           │
│    AiAccessService: AI 权限门禁                               │
│    MySQL: user_pet_prefs / pet_chat_daily                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 前端技术栈（宠物相关）

| 层级 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript + Vite |
| 状态 | Pinia（`usePetStore`） |
| UI | Element Plus（按钮、表单、Tooltip） |
| 3D 引擎 | `three` ^0.186 |
| VRM | `@pixiv/three-vrm` ^3.5（`VRMLoaderPlugin` + Humanoid / Expression） |
| 动画资源 | Mixamo 导出 FBX；`FBXLoader` + `mixamoVRMRigMap` 重定向 |
| 粒子特效 | 原生 Canvas 2D（非 Three） |
| 语音 | 浏览器 Web Speech API（无额外 npm 包） |
| 网络 | Axios 封装 `http`，统一 `ApiSuccess` |

### 3.3 后端技术栈（宠物相关）

| 层级 | 技术 |
|------|------|
| 框架 | NestJS + TypeScript |
| ORM | TypeORM（`synchronize=false`，表结构以 SQL 为准） |
| 鉴权 | JWT `JwtAuthGuard` + `@CurrentUser` |
| 校验 | class-validator / class-transformer DTO |
| AI | 既有 `DeepseekClientService.petChat`（OpenAI 兼容 Chat Completions） |
| 配置 | `DEEPSEEK_API_KEY`、`PET_CHAT_DAILY_LIMIT` |

### 3.4 数据库

权威结构见 `db/init.sql`；增量迁移脚本 `db/migrate_pet_assistant.sql`。

**`user_pet_prefs`**（一对一用户偏好）

| 列 | 类型 | 含义 |
|----|------|------|
| `user_id` | BIGINT PK / FK → users | 用户 |
| `skin_id` | VARCHAR(32) | 形象 ID，默认 `robin` |
| `pet_enabled` | TINYINT(1) | 是否显示 |
| `wake_word_overrides` | JSON NULL | 按 skinId 覆盖唤醒词 |
| `updated_at` | DATETIME(3) | 更新时间 |

**`pet_chat_daily`**（日对话计数）

| 列 | 类型 | 含义 |
|----|------|------|
| `user_id` + `day_date` | 联合主键 | 用户某日 |
| `chat_count` | INT UNSIGNED | 当日已对话次数 |

隔离：所有读写均带当前登录 `userId`；外键 `ON DELETE CASCADE`。

---

## 4. API 设计

基路径：`/pet-assistant`（需 JWT）。Nginx 反代白名单需包含 `pet-assistant`（见 `DEPLOY.md`）。

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/pet-assistant/prefs` | 获取偏好；无记录则创建默认并返回 |
| `PATCH` | `/pet-assistant/prefs` | 更新 `skinId` / `petEnabled` / `wakeWordOverrides` |
| `POST` | `/pet-assistant/chat` | AI 对话；校验 AI 权限与日限 |

**Chat 请求要点**

- `message` ≤ 1000  
- `history` ≤ 10 条，每条 ≤ 2000  
- `context` ≤ 500（前端传页面路径）  
- `skinId` 可选，非法则回退偏好 / `robin`  

**Chat 响应**

- `reply`：模型回复（服务端再截断至 500）  
- `model`：实际模型名  
- `skinId`：本次使用的形象  

**错误场景示例**

- 未配置 `DEEPSEEK_API_KEY` → 503  
- 无 AI 权限 → 由 `AiAccessService` 拒绝  
- 日限达上限 → 400「今日宠物对话已达上限」  

---

## 5. 前端模块说明

### 5.1 目录一览

```
apps/web/src/
  components/pet/
    PetCompanion.vue      # 浮层编排、拖拽、庆祝、欢迎
    PetAvatar.vue         # 对 VrmCanvas 的薄封装
    PetVrmCanvas.vue      # Canvas 挂载、全屏庆祝壳
    PetCelebrationFx.vue  # 花瓣/烟花
    PetChatPanel.vue      # AI 对话 UI
    PetSkinPicker.vue     # 形象选择
    PetBubble.vue         # 气泡
    skins.ts              # 皮肤定义 + resolveVrmUrl
    scripts.ts            # 事件台词
    event-map.ts          # 事件→动作、时长
    vrm-action-map.ts     # 动作→VRM 表情预设
    mixamoVRMRigMap.ts    # Mixamo 骨名→VRM Humanoid
    PetCameraController.ts
  composables/
    useVrmPet.ts          # Three/VRM 核心循环
    loadMixamoAnimation.ts
    usePetWakeWord.ts
    usePetSpeech.ts
    usePetCelebrateBgm.ts
  stores/pet.ts
  api/pet-assistant.ts
  views/settings/PetCompanionView.vue
public/
  models/character.vrm
  animations/mixamo/dance-hiphop.fbx
  audio/celebrate-bgm.mp3
```

### 5.2 Pinia Store（`stores/pet.ts`）

核心状态：`skinId`、`petEnabled`、`action`、`bubble`、`position`、`panelOpen`、`listening`、`celebrating`、`celebrateSeq` / `celebrateLine`、`canUseAi` 等。

关键方法：

- `emitPetEvent(type)`：节流 + 挑台词 + `playAction` + 气泡  
- `requestCelebration({ line })`：置 `celebrating` 并递增 `celebrateSeq`，由 Companion 监听执行全屏庆祝  
- `loadPrefs` / `setSkin` / `setPetEnabled` / `setWakeWordForCurrent`：与后端同步  

### 5.3 VRM 渲染管线（`useVrmPet`）

1. `WebGLRenderer` 透明背景、ACES 色调映射、柔和三点光 + 环境光  
2. `GLTFLoader` + `VRMLoaderPlugin` 加载 VRM；`VRMUtils` 处理  
3. 每帧：眨眼、表情权重插值、嘴型（talk）、可选低头（think）、相机 Tween  
4. **日常动作以 Expression 为主**，非骨骼动画；仅庆祝走 Mixamo 骨骼动画  
5. `prefers-reduced-motion` 时减弱动效  
6. 页面不可见时暂停 RAF，降低占用  

舞蹈：`AnimationMixer` 播放重定向后的 clip；hips 高度按 VRM rest pose 缩放；兼容 VRM0 朝向。

### 5.4 资源 URL 与部署

`resolveVrmUrl(path)` = `import.meta.env.BASE_URL` + 相对路径。  
二级目录部署（如 `/study-system/`）时，若写死 `/animations/...` 会导致 404；舞蹈与 BGM 已统一走该函数。

发布包需带上：

- `models/character.vrm`  
- `animations/mixamo/*.fbx`  
- `audio/celebrate-bgm.mp3`  

Nginx 需反代 `pet-assistant`；静态资源由前端站点直接提供。

---

## 6. AI 人设与提示词

后端 `DeepseekClientService.petChat` 系统提示要点：

- 身份：学习系统电子宠物「{skinName}」  
- 人设：各皮肤 `personality`（见 `apps/api/src/pet-assistant/pet-skins.ts`）  
- 约束：中文短句、口语友善、可适度卖萌；可鼓励学习/聊错题；**不编造成绩或积分**；禁止 JSON / Markdown 长文  
- 可选：当前页面上下文  
- 采样：`temperature: 0.7`，`maxTokens: 256`  

前后端人设 ID 列表必须保持一致（`PET_SKIN_IDS`）。

---

## 7. 业务集成点

| 业务 | 集成方式 | 效果 |
|------|----------|------|
| 错题详情 `ErrorDetailView` | `emitPetEvent('attempt_correct' \| 'attempt_wrong')` | 短动作 + 气泡 |
| 知识卡片保存 | `emitPetEvent('knowledge_saved')` | 点头类反馈 |
| 化学训练提交全对 | `requestCelebration({ line: pickPetLine(...) })` | **全屏跳舞祝贺** |
| 设置页 | 读写偏好与本机语音/BGM | 用户配置 |

扩展建议：其他「整套满分」场景可同样调用 `requestCelebration`；单题正确继续用 `emitPetEvent('attempt_correct')` 以免过于频繁全屏。

---

## 8. 安全与配额

| 项 | 措施 |
|----|------|
| 鉴权 | 全部 pet-assistant 接口 JWT |
| 越权 | prefs / daily 均按 `userId` 读写 |
| AI 门禁 | 独立 AI 权限断言 |
| 输入限制 | DTO 长度与 history 条数上限 |
| 日配额 | `PET_CHAT_DAILY_LIMIT`（默认 40） |
| 唤醒词 | 服务端 sanitize：仅合法 skinId、最长 32 字 |

前端本地项（位置、语音开关、音色等）存浏览器，不跨用户同步。

---

## 9. 已知限制与后续可演进方向

### 9.1 当前限制

1. **六皮肤共用同一 VRM**：人设差异主要在文案与表情，视觉模型未分身。  
2. **日常动作非骨骼动画**：idle/cheer 等以 Expression 驱动，观感弱于 Mixamo 舞蹈。  
3. **听写依赖浏览器与网络**：Safari/部分环境支持差；需麦克风权限。  
4. **TTS 依赖本机语音包**：无法上传自定义声库。  
5. **庆祝资源体积**：FBX / VRM 需随前端发布；二级路径配置错误会导致舞蹈失败。  
6. **化学全对祝贺仅绑在会话提交页**：从结果页回看不会重复触发（符合预期）。

### 9.2 可演进方向（未实现）

- 每皮肤独立 VRM 或材质换色  
- 更多 Mixamo 动作库（挥手、思考等）按 `PetAction` 映射  
- 错题连续答对 N 次升级为全屏庆祝  
- 服务端记录庆祝次数 / 成就联动积分  
- 将 Piper 等本地 TTS 作为可选增强（需评估依赖与打包体积）  

---

## 10. 运维与发布检查清单

1. 执行 `db/migrate_pet_assistant.sql`（或确保 `init.sql` 已含两表）。  
2. API `.env`：`DEEPSEEK_API_KEY`；可选 `PET_CHAT_DAILY_LIMIT`。  
3. Nginx：`location` 反代包含 `pet-assistant`。  
4. 前端 `BASE_URL` 与静态资源路径一致。  
5. 发布目录含 `models/`、`animations/mixamo/`、`audio/`。  
6. 浏览器：推荐最新 Chrome/Edge；允许麦克风；安装中文语音。  

参考：`DEPLOY.md`、`SERVER_UPDATE_CHECKLIST.md`、`db/apply_pet_and_chemistry_on_server.bat`。

---

## 11. 关键源码索引

| 主题 | 路径 |
|------|------|
| 浮层编排 | `apps/web/src/components/pet/PetCompanion.vue` |
| VRM 引擎 | `apps/web/src/composables/useVrmPet.ts` |
| Mixamo 重定向 | `apps/web/src/composables/loadMixamoAnimation.ts` |
| 状态机 | `apps/web/src/stores/pet.ts` |
| 听写 | `apps/web/src/composables/usePetWakeWord.ts` |
| TTS | `apps/web/src/composables/usePetSpeech.ts` |
| 后端模块 | `apps/api/src/pet-assistant/*` |
| AI 提示词 | `apps/api/src/ai-reference/deepseek-client.service.ts` → `petChat` |
| 库表 | `db/migrate_pet_assistant.sql` / `db/init.sql` |
| 化学全对祝贺 | `apps/web/src/views/chemistry/ChemistryTrainSessionView.vue` |

---

## 12. 总结

电子宠物是一套**前端重、后端轻**的陪伴子系统：三维呈现与交互几乎全部在浏览器完成；服务端只负责**偏好持久化、AI 门禁与配额、人设对话**。与学习业务的结合点清晰——短事件用 `emitPetEvent`，重大正向结果（如化学训练全对）用 `requestCelebration` 触发 Mixamo 全屏祝贺。整体技术选型贴合现有 Vue3 + NestJS 栈，并刻意避免引入额外 TTS/游戏引擎依赖，便于在 Windows 服务器与 `/study-system/` 二级目录场景下部署维护。
