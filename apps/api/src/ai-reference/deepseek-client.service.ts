import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type AiGeneratedItem = {
  stemText: string
  answerText: string
  analysisText: string
}

export type WritingReviewLevel = 'pass' | 'weak' | 'fail'

export type WritingReviewDimension = {
  level: WritingReviewLevel
  reason: string
  suggestion: string
}

export type WritingStructureReview = {
  onTopic: WritingReviewDimension
  evidence: WritingReviewDimension
  transition: WritingReviewDimension
  overallHint: string
}

export type WritingGaokaoDimension = {
  key: string
  label: string
  score: number
  fullScore: number
  comment: string
}

export type WritingGaokaoReview = {
  kind: 'gaokao'
  totalScore: number
  fullScore: number
  dimensions: WritingGaokaoDimension[]
  analysis: string
  deductions: string[]
  suggestions: string[]
  overall: string
  /** 按点评改写的参考范文（仅文字） */
  modelEssay: string
  modelEssayNotes: string[]
}

export type WritingReviewJson = WritingStructureReview | WritingGaokaoReview

@Injectable()
export class DeepseekClientService {
  constructor(private readonly config: ConfigService) {}

  private apiKey() {
    return this.config.get<string>('DEEPSEEK_API_KEY', '').trim()
  }

  private baseUrl() {
    return this.config
      .get<string>('DEEPSEEK_BASE_URL', 'https://api.deepseek.com')
      .replace(/\/$/, '')
  }

  private model() {
    return this.config.get<string>('DEEPSEEK_MODEL', 'deepseek-chat').trim()
  }

  /** flash/reasoner 会先写 reasoning_content，需要更大 token 预算 */
  private isReasoningModel(model: string) {
    const m = model.toLowerCase()
    return m.includes('reasoner') || m.includes('flash') || m.includes('r1')
  }

  async generateSimilar(params: {
    subjectName: string | null
    categoryName: string | null
    tags: string[]
    sourceStem: string
    avoidStems: string[]
    count: number
    expandMode?: 'SIMILAR' | 'EXPAND'
  }): Promise<{ items: AiGeneratedItem[]; model: string }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }

    const count = Math.min(3, Math.max(1, params.count))
    const expandMode = params.expandMode === 'SIMILAR' ? 'SIMILAR' : 'EXPAND'
    const avoid = params.avoidStems
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 12)
      .map((s, i) => `${i + 1}. ${s.slice(0, 400)}`)
      .join('\n')

    // 源题干里的 LaTeX 反斜杠在提示中保留即可；要求模型输出时用双反斜杠或改用纯文本分数
    const sourceStem = params.sourceStem.slice(0, 6000)

    const modeRules =
      expandMode === 'SIMILAR'
        ? `扩展程度：同类巩固
- 可保留相近题型与难度，但仍须改写情境与问法，禁止「只改数字」。
- 多题时尽量用不同情境，不要互相复制骨架。`
        : `扩展程度：拓展训练（默认，要求明显扩展）
- 严禁仅替换数字/单位/人名而保留原题句子结构。
- 生成 ${count} 题时，各题必须分属不同扩展策略（可从下列选，勿重复同一策略）：
  A. 换情境：生活/几何/应用背景全换，题干叙事结构与原题明显不同；
  B. 换问法：等价变形、逆向设问、由结果反推条件等；
  C. 加一步：同知识点上增加中间推理、隐藏条件或干扰信息（仍可独立解答）；
  D. 综合应用：与相邻知识点结合，但仍落在给定科目/分类范围内。
- 每题 analysisText 末尾用一句话标明「扩展点：…」（相对原题改了什么）。
- 难度可略升，但必须保证答案严谨、初高中范围内可解。`

    const system = `你是资深中学教师与命题人。任务：根据「原错题」生成可用于巩固与拓展的练习题，而不是简单改数字。
规则：
1. 科目、核心知识点与原题一致；禁止抄原题原文或只改个别数字。
2. 题干须在表述、情境或设问上与原题有实质差异；相似度过高视为不合格。
3. ${modeRules}
4. 每题必须包含：题干 stemText、答案 answerText、分步解析 analysisText。
5. 最终只输出一个合法 JSON 对象，不要 Markdown 代码围栏，不要解释性前后缀。
6. JSON 字符串内：换行写成 \\n；LaTeX 反斜杠必须写成 \\\\（例如 \\\\frac{1}{a}）；也可改写为纯文本如 (1/a)+(1/b)。
7. 答案可能被家长核对，请尽量严谨；不确定处在解析中说明。
8. 严格避开「禁止相似」列表中的题目。
9. 若你会先思考：思考尽量短，想完后必须在最终回复中给出完整 JSON。`

    const user = `科目：${params.subjectName || '未知'}
分类/题型：${params.categoryName || '未知'}
标签：${params.tags.length ? params.tags.join('、') : '无'}
生成数量：${count}
扩展模式：${expandMode === 'SIMILAR' ? '同类巩固' : '拓展训练'}

【原错题题干】
${sourceStem}

【禁止相似（已有题干，请换策略/换情境，禁止只改数字）】
${avoid || '（无）'}

请只输出如下 JSON（不要其它文字）：
{"items":[{"stemText":"...","answerText":"...","analysisText":"..."}]}`

    const model = this.model()
    let content = await this.chat({
      key,
      model,
      system,
      user,
      temperature: expandMode === 'EXPAND' ? 0.85 : 0.7,
    })
    let items = this.parseItems(content)

    if (!items.length) {
      content = await this.chat({
        key,
        model,
        system:
          system +
          '\n上次输出无法解析。本次务必在最终内容中给出完整 JSON；数学式优先用纯文本分数如 1/a+1/b，避免反斜杠转义问题。',
        user,
        temperature: 0.2,
      })
      items = this.parseItems(content)
    }

    // 仍失败：尝试修复未转义反斜杠后再解析
    if (!items.length && content) {
      items = this.parseItems(this.repairJsonBackslashes(content))
    }

    if (!items.length) {
      throw new ServiceUnavailableException(
        '模型未返回有效题目 JSON。若使用 deepseek-flash，可在 .env 改 DEEPSEEK_MODEL=deepseek-chat 后重试',
      )
    }
    return { items: items.slice(0, count), model }
  }

  /** 结构教练：按科生成作文/论述题目（只出题，不写范文） */
  async generateWritingTopic(params: {
    subjectTrack: 'chinese' | 'english'
    hint?: string | null
  }): Promise<{
    topicText: string
    topicRequirements: string | null
    model: string
  }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }

    const isChinese = params.subjectTrack === 'chinese'
    const hint = (params.hint || '').trim().slice(0, 500)

    const system = isChinese
      ? `你是资深语文教师，只负责生成「议论文/论述文」练习题目，禁止写提纲、首段或全文。
规则：
1. 适合初高中：题目清晰、可写 600～800 字论述。
2. 只输出合法 JSON，不要 Markdown 围栏，不要其它文字。
3. JSON 字段：topicText（题目）、topicRequirements（写作要求，可空字符串）。
4. 禁止输出 outline、opening、essay、draft、范文 等字段或正文。`
      : `你是资深英语教师，只负责生成 English essay 练习题目（如议论文/观点论述），禁止写 outline、opening 或全文。
规则：
1. 适合中学生：题目清晰，可写 150～250 词短文。
2. 只输出合法 JSON，不要 Markdown 围栏，不要其它文字。
3. JSON 字段：topicText（英文题目）、topicRequirements（写作要求，可用中文说明，可空字符串）。
4. 禁止输出 outline、opening、essay、draft、范文 等字段或正文。`

    const user = isChinese
      ? `请生成一道语文论述/议论文题目。
${hint ? `方向提示（可参考）：${hint}` : '方向：自拟贴近学生生活或思辨的主题。'}
只输出：{"topicText":"...","topicRequirements":"..."}`
      : `Please generate one English essay prompt for secondary school students.
${hint ? `Hint (optional): ${hint}` : 'Theme: everyday life or a clear opinion topic.'}
Output only: {"topicText":"...","topicRequirements":"..."}`

    const model = this.model()
    let content = await this.chat({
      key,
      model,
      system,
      user,
      temperature: 0.85,
    })
    let parsed = this.parseWritingTopic(content)
    if (!parsed) {
      content = await this.chat({
        key,
        model,
        system: system + '\n上次无法解析。本次务必只输出完整 JSON。',
        user,
        temperature: 0.3,
      })
      parsed = this.parseWritingTopic(content)
    }
    if (!parsed) {
      throw new ServiceUnavailableException('模型未返回有效题目 JSON，请重试')
    }
    return { ...parsed, model }
  }

  /** 结构教练：只评扣题/证据/过渡，禁止代写 */
  async reviewWritingStructure(params: {
    subjectTrack: 'chinese' | 'english'
    topicText: string
    topicRequirements?: string | null
    outlineText: string
    openingText: string
  }): Promise<{
    review: WritingStructureReview
    model: string
  }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }

    const isChinese = params.subjectTrack === 'chinese'
    const topic = params.topicText.slice(0, 4000)
    const req = (params.topicRequirements || '').trim().slice(0, 2000)
    const outline = params.outlineText.slice(0, 6000)
    const opening = params.openingText.slice(0, 4000)

    const system = `你是作文结构教练，只评价学生已写的「提纲」和「首段」，禁止代写或扩写终稿。
必须只评三项：
1. onTopic：论点是否扣题
2. evidence：证据/支撑是否够
3. transition：过渡是否糊（衔接是否清晰）
每项给出 level（pass|weak|fail）、reason（一句理由）、suggestion（一句可改点）。
另给 overallHint（总提示，一两句）。
规则：
1. 只用中文点评（英语作文可用英文术语夹中文说明）。
2. 只输出合法 JSON，不要 Markdown 围栏。
3. 禁止输出 essay、draft、fullText、rewrittenOpening、代写提纲/首段/全文。
4. JSON 形状：
{"onTopic":{"level":"pass|weak|fail","reason":"...","suggestion":"..."},"evidence":{...},"transition":{...},"overallHint":"..."}`

    const user = `${isChinese ? '科目：语文论述' : '科目：英语 Essay'}
【题目】
${topic}
【写作要求】
${req || '（无）'}
【提纲】
${outline}
【首段】
${opening}

请只输出规定 JSON。`

    const model = this.model()
    let content = await this.chat({
      key,
      model,
      system,
      user,
      temperature: 0.4,
    })
    let review = this.parseWritingReview(content)
    if (!review) {
      content = await this.chat({
        key,
        model,
        system: system + '\n上次无法解析。本次务必只输出完整 JSON，且不要写范文。',
        user,
        temperature: 0.2,
      })
      review = this.parseWritingReview(content)
    }
    if (!review) {
      throw new ServiceUnavailableException('模型未返回有效点评 JSON，请重试')
    }
    return { review, model }
  }

  /** 高考评测：只评已写全文，禁止代写 */
  async reviewGaokaoEssay(params: {
    subjectTrack: 'chinese' | 'english'
    topicText: string
    topicRequirements?: string | null
    essayText: string
  }): Promise<{ review: WritingGaokaoReview; model: string }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }

    const isChinese = params.subjectTrack === 'chinese'
    const topic = params.topicText.slice(0, 4000)
    const req = (params.topicRequirements || '').trim().slice(0, 2000)
    const essay = params.essayText.slice(0, 12000)
    const fullScore = isChinese ? 60 : 25

    const system = isChinese
      ? `你是高考语文阅卷教师，只评学生已写的全文，禁止代写或改写成范文。
按高考作文（满分 ${fullScore}）给分：内容 20、表达 20、发展等级 20。
规则：
1. 对照题目与写作要求；只评文本，不考虑卷面书写。
2. 只用中文。只输出合法 JSON，不要 Markdown 围栏。
3. 禁止输出 rewrittenEssay、范文、全文改写。
4. JSON：
{"kind":"gaokao","totalScore":0,"fullScore":${fullScore},"dimensions":[{"key":"content","label":"内容","score":0,"fullScore":20,"comment":"..."},{"key":"expression","label":"表达","score":0,"fullScore":20,"comment":"..."},{"key":"development","label":"发展等级","score":0,"fullScore":20,"comment":"..."}],"analysis":"总体解析","deductions":["扣分点"],"suggestions":["可改建议"],"overall":"总评一两句"}
5. totalScore 必须等于三项 score 之和，且不超过满分。`
      : `你是高考英语书面表达阅卷教师，只评学生已写的全文，禁止代写或改写成范文。
按高考英语书面表达（满分 ${fullScore}）给分：内容 10、语言 10、组织 5。
规则：
1. 对照题目与写作要求；只评文本。点评用中文，可夹英文例句短语。
2. 只输出合法 JSON，不要 Markdown 围栏。
3. 禁止输出 rewrittenEssay、范文、全文改写。
4. JSON：
{"kind":"gaokao","totalScore":0,"fullScore":${fullScore},"dimensions":[{"key":"content","label":"内容","score":0,"fullScore":10,"comment":"..."},{"key":"language","label":"语言","score":0,"fullScore":10,"comment":"..."},{"key":"organization","label":"篇章结构","score":0,"fullScore":5,"comment":"..."}],"analysis":"总体解析","deductions":["扣分点"],"suggestions":["可改建议"],"overall":"总评一两句"}
5. totalScore 必须等于三项 score 之和，且不超过满分。`

    const user = `${isChinese ? '科目：高考语文作文' : '科目：高考英语书面表达'}
【题目】
${topic}
【写作要求】
${req || '（无）'}
【学生全文】
${essay}

请只输出规定 JSON。分数仅供练习参考。`

    const model = this.model()
    let content = await this.chat({
      key,
      model,
      system,
      user,
      temperature: 0.3,
    })
    let review = this.parseGaokaoReview(content, fullScore)
    if (!review) {
      content = await this.chat({
        key,
        model,
        system: system + '\n上次无法解析。本次务必只输出完整 JSON，且不要写范文。',
        user,
        temperature: 0.15,
      })
      review = this.parseGaokaoReview(content, fullScore)
    }
    if (!review) {
      throw new ServiceUnavailableException('模型未返回有效高考评测 JSON，请重试')
    }

    const modelEssay = await this.generateGaokaoModelEssay({
      key,
      model,
      isChinese,
      topic,
      req,
      essay,
      review,
    })
    review.modelEssay = modelEssay.essay
    review.modelEssayNotes = modelEssay.notes
    return { review, model }
  }

  private async generateGaokaoModelEssay(params: {
    key: string
    model: string
    isChinese: boolean
    topic: string
    req: string
    essay: string
    review: WritingGaokaoReview
  }): Promise<{ essay: string; notes: string[] }> {
    const dimText = params.review.dimensions
      .map((d) => `${d.label} ${d.score}/${d.fullScore}：${d.comment}`)
      .join('\n')
    const deduct = params.review.deductions.length
      ? params.review.deductions.map((x, i) => `${i + 1}. ${x}`).join('\n')
      : '（无）'
    const suggest = params.review.suggestions.length
      ? params.review.suggestions.map((x, i) => `${i + 1}. ${x}`).join('\n')
      : '（无）'

    const lengthHint = this.inferEssayLengthLimit(
      params.isChinese,
      params.req,
      params.essay,
    )

    const system = params.isChinese
      ? `你是高考语文写作升格教师。目标：句式和用词明显升一档，禁止只改错别字。
硬性规则：
1. 保留原意、事例、段落顺序。
2. 至少重写 4 个句子（不是同骨架换一两个词）。
3. notes 至少 5 条，必须是词汇/句式对照；禁止写拼写、标点、落款。
4. 不得超过字数上限。只输出 JSON：{"essay":"...","notes":["..."]}`
      : `You are a gaokao English writing UPGRADE coach. Proofreading-only output is a FAIL.

The student's letter is full of typos. After fixing them, the SENTENCE FRAMES are still too simple (I'm sorry to hear / It is common / First of all / try your best / Moreover). You MUST recast those frames.

KEEP: same 4 advice points, same addressee Peter, same Li Hua, same overall logic.
CHANGE: rewrite most sentences with common gaokao advanced patterns. Required: the essay MUST contain at least 4 of:
- it is widely acknowledged that
- relieve (your) pressure / take your mind off
- you are supposed to
- spare no effort
- attach (great) importance to
- it is of great help / it would be helpful if
- not only ... but also
- as a result / therefore
- make a practical/detailed study plan
- a variety of

Also: paragraph the letter (greeting; understanding; suggestions; closing). Word limit is HARD.

BAD (too close to original, even if spelled correctly):
"I'm sorry to hear that you are under great pressure now. It is common to feel anxious... To begin with, you can draw your attention to other things. Participating in a wide range of activities is a good choice."

GOOD (same ideas, upgraded sentences, still within word limit):
"I'm sorry to hear that you are under great pressure. It is widely acknowledged that students often feel anxious before exams, so I truly understand you. Here are some practical suggestions to help you relieve your pressure.
To begin with, you can take part in a variety of after-class activities so that you can take your mind off the exam. Besides, you are supposed to make a practical study plan and spare no effort. As a result, your hard work will pay off. Moreover, it is of great help to share your worries with parents or friends, who will keep you company. Last but not least, stay optimistic and believe that you will make it."

notes: Chinese contrast of SENTENCE/PHRASE upgrades only, at least 6 items. NEVER list spelling (uncler, carefully, Payoff, Yours).
JSON only: {"essay":"...","notes":["..."]}`

    const user = `${params.isChinese ? '高考语文' : '高考英语书面表达'}
【题目】
${params.topic}
【写作要求】
${params.req || '（无）'}
【字数硬性上限】${lengthHint}
【学生原文】
${params.essay}
【阅卷总评】
${params.review.overall}
【分项】
${dimText}
【扣分点】
${deduct}
【修改建议】
${suggest}

不合格：几乎照抄原文，只改拼写、只把 First of all 换成 To begin with、tips 换成 practical suggestions。必须重写多数句子并嵌入常用高级表达，逻辑不变，不超字数。
请只输出 JSON。`

    let content = await this.chat({
      key: params.key,
      model: params.model,
      system,
      user,
      temperature: 0.65,
    })
    let parsed = this.parseModelEssay(content)
    if (
      !parsed ||
      this.isWeakModelEssay(params.essay, parsed.essay, parsed.notes, params.isChinese)
    ) {
      content = await this.chat({
        key: params.key,
        model: params.model,
        system:
          system +
          '\n上次失败：正文几乎是原文校对版。本次必须重写多数句子，嵌入至少4个指定常用高级句式，notes 禁止拼写条目，且不超字数。',
        user,
        temperature: 0.5,
      })
      const again = this.parseModelEssay(content)
      if (again) parsed = again
    }
    if (!parsed) return { essay: '', notes: [] }
    return {
      essay: parsed.essay,
      notes: parsed.notes.filter((n) => !this.isProofreadingNote(n)),
    }
  }

  private isProofreadingNote(note: string): boolean {
    return /(拼写|标点|大写|空格|署名|落款|yours|uncler|carefilly|payoff|paticipat|undestand|\bno\b|adu|keep your company|it common|改为\s*under|改为\s*carefully|改为\s*pay off|改为\s*understand|改为\s*Li Hua|改为\s*keep you company)/i.test(
      note,
    )
  }

  private isWeakModelEssay(
    original: string,
    upgraded: string,
    notes: string[],
    isChinese: boolean,
  ): boolean {
    if (this.isWeakUpgradeNotes(notes, isChinese)) return true
    if (!isChinese && this.countGaokaoPhrases(upgraded) < 3) return true
    return this.essayTooSimilar(original, upgraded, isChinese)
  }

  private countGaokaoPhrases(essay: string): number {
    const bank = [
      /it is widely acknowledged/i,
      /relieve (your )?pressure/i,
      /take your mind off/i,
      /you are supposed to/i,
      /spare no effort/i,
      /attach (great )?importance to/i,
      /it is of great help/i,
      /not only .{5,80} but also/i,
      /\bas a result\b/i,
      /study plan/i,
      /a variety of/i,
      /take \w+ into consideration/i,
    ]
    return bank.filter((re) => re.test(essay)).length
  }

  private essayTooSimilar(original: string, upgraded: string, isChinese: boolean): boolean {
    const tok = (s: string) => {
      const raw = isChinese
        ? s.replace(/\s/g, '')
        : s.toLowerCase().replace(/[^a-z'\s]/g, ' ')
      const parts = isChinese
        ? [...raw]
        : raw.split(/\s+/).filter((w) => w.length > 2)
      const stop = new Set([
        'the',
        'and',
        'that',
        'you',
        'your',
        'for',
        'with',
        'are',
        'will',
        'dear',
        'peter',
        'hua',
      ])
      return parts.filter((w) => !stop.has(w))
    }
    const a = tok(original)
    const b = new Set(tok(upgraded))
    if (!a.length) return false
    const hit = a.filter((w) => b.has(w)).length
    return hit / a.length >= 0.78
  }

  /** notes 若几乎全是拼写/标点修正，视为升格失败 */
  private isWeakUpgradeNotes(notes: string[], isChinese: boolean): boolean {
    if (!notes.length) return true
    const weak = notes.filter((n) => this.isProofreadingNote(n)).length
    const need = isChinese ? 4 : 5
    return notes.length - weak < need
  }

  private parseModelEssay(content: string): { essay: string; notes: string[] } | null {
    for (const text of this.extractJsonCandidates(content)) {
      for (const candidate of [text, this.repairJsonBackslashes(text)]) {
        try {
          const parsed = JSON.parse(candidate) as Record<string, unknown>
          const essay = String(parsed.essay || parsed.modelEssay || parsed.text || '').trim()
          if (essay.length < 40) continue
          const notes = Array.isArray(parsed.notes)
            ? parsed.notes.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
            : []
          return { essay: essay.slice(0, 12000), notes }
        } catch {
          // next
        }
      }
    }
    return null
  }

  /** 从写作要求推断字/词上限，并对照原文长度 */
  private inferEssayLengthLimit(
    isChinese: boolean,
    req: string,
    essay: string,
  ): string {
    const original = isChinese
      ? essay.replace(/\s/g, '').length
      : (essay.trim().match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length
    const unit = isChinese ? '字' : '词'
    const text = `${req || ''} `
    let max: number | null = null
    let min: number | null = null

    const atLeast = text.match(
      /(?:不少于|不得少于|至少|no fewer than|at least)\s*(\d+)\s*(字|词|words?)?/i,
    )
    if (atLeast) min = Number(atLeast[1])

    const range = text.match(/(\d+)\s*[-~～至到]\s*(\d+)\s*(字|词|words?)/i)
    if (range) {
      min = Number(range[1])
      max = Number(range[2])
    }
    if (max == null) {
      const cap = text.match(
        /(?:不超过|不多于|不得多于|限|控制在|within)\s*(\d+)\s*(字|词|words?)?/i,
      )
      if (cap) max = Number(cap[1])
    }
    if (max == null) {
      const around = text.match(/(\d+)\s*(字|词|words?)\s*(?:左右|以内)/i)
      if (around) max = Number(around[1])
    }
    if (max == null && min == null) {
      const words = text.match(/(\d+)\s*(words?|词)/i)
      const chars = text.match(/(\d+)\s*字/)
      if (!isChinese && words) max = Number(words[1])
      if (isChinese && chars) max = Number(chars[1])
    }
    if (max == null) {
      if (min != null) {
        max = isChinese ? Math.round(min * 1.1) : min <= 100 ? 120 : Math.round(min * 1.15)
      } else {
        max = isChinese ? 800 : 120
      }
    }

    const minPart = min != null ? `不少于 ${min} ${unit}，` : ''
    return `原文约 ${original} ${unit}。${minPart}升格后不得超过 ${max} ${unit}。用替换升格，禁止超上限。`
  }

  private parseGaokaoReview(
    content: string,
    expectedFull: number,
  ): WritingGaokaoReview | null {
    const clamp = (n: number, max: number) => {
      if (!Number.isFinite(n)) return 0
      return Math.max(0, Math.min(max, Math.round(n * 10) / 10))
    }

    for (const text of this.extractJsonCandidates(content)) {
      for (const candidate of [text, this.repairJsonBackslashes(text)]) {
        try {
          const parsed = JSON.parse(candidate) as Record<string, unknown>
          const dimsRaw = Array.isArray(parsed.dimensions) ? parsed.dimensions : []
          const dimensions: WritingGaokaoDimension[] = dimsRaw
            .map((d) => {
              const o = d as Record<string, unknown>
              const fullScore = clamp(Number(o.fullScore || 0), 60)
              const score = clamp(Number(o.score || 0), fullScore || 60)
              const label = String(o.label || o.key || '').trim()
              const comment = String(o.comment || o.reason || '').trim()
              if (!label || !comment) return null
              return {
                key: String(o.key || label).slice(0, 40),
                label: label.slice(0, 40),
                score,
                fullScore: fullScore || score,
                comment: comment.slice(0, 800),
              }
            })
            .filter((x): x is WritingGaokaoDimension => !!x)
          if (dimensions.length < 2) continue
          const sum = dimensions.reduce((a, d) => a + d.score, 0)
          const fullScore = clamp(Number(parsed.fullScore || expectedFull), 60) || expectedFull
          let totalScore = clamp(Number(parsed.totalScore || sum), fullScore)
          if (Math.abs(totalScore - sum) > 0.2) totalScore = clamp(sum, fullScore)
          const deductions = Array.isArray(parsed.deductions)
            ? parsed.deductions.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
            : []
          const suggestions = Array.isArray(parsed.suggestions)
            ? parsed.suggestions.map((x) => String(x).trim()).filter(Boolean).slice(0, 8)
            : []
          const analysis = String(parsed.analysis || '').trim().slice(0, 2000)
          const overall = String(parsed.overall || parsed.overallHint || '').trim().slice(0, 800)
          return {
            kind: 'gaokao',
            totalScore,
            fullScore,
            dimensions,
            analysis: analysis || '请对照分项评语自行修改，终稿须自己写。',
            deductions,
            suggestions,
            overall: overall || '分数仅供练习参考，非官方阅卷。',
            modelEssay: '',
            modelEssayNotes: [],
          }
        } catch {
          // next
        }
      }
    }
    return null
  }

  private parseWritingTopic(
    content: string,
  ): { topicText: string; topicRequirements: string | null } | null {
    for (const text of this.extractJsonCandidates(content)) {
      for (const candidate of [text, this.repairJsonBackslashes(text)]) {
        try {
          const parsed = JSON.parse(candidate) as Record<string, unknown>
          const topicText = String(
            parsed.topicText || parsed.topic || parsed.title || '',
          ).trim()
          if (!topicText) continue
          const req = String(
            parsed.topicRequirements || parsed.requirements || '',
          ).trim()
          return {
            topicText: topicText.slice(0, 8000),
            topicRequirements: req ? req.slice(0, 4000) : null,
          }
        } catch {
          // next
        }
      }
    }
    return null
  }

  private parseWritingReview(content: string): WritingStructureReview | null {
    const levels = new Set(['pass', 'weak', 'fail'])
    const normalizeDim = (raw: unknown): WritingReviewDimension | null => {
      if (!raw || typeof raw !== 'object') return null
      const o = raw as Record<string, unknown>
      const level = String(o.level || '').toLowerCase()
      if (!levels.has(level)) return null
      const reason = String(o.reason || '').trim()
      const suggestion = String(o.suggestion || '').trim()
      if (!reason) return null
      return {
        level: level as WritingReviewLevel,
        reason: reason.slice(0, 500),
        suggestion: (suggestion || '请针对该项自行修改').slice(0, 500),
      }
    }

    for (const text of this.extractJsonCandidates(content)) {
      for (const candidate of [text, this.repairJsonBackslashes(text)]) {
        try {
          const parsed = JSON.parse(candidate) as Record<string, unknown>
          const onTopic = normalizeDim(parsed.onTopic)
          const evidence = normalizeDim(parsed.evidence)
          const transition = normalizeDim(parsed.transition)
          if (!onTopic || !evidence || !transition) continue
          const overallHint = String(parsed.overallHint || '').trim().slice(0, 800)
          return {
            onTopic,
            evidence,
            transition,
            overallHint: overallHint || '请根据三项点评自行改提纲与首段，终稿须自己写。',
          }
        } catch {
          // next
        }
      }
    }
    return null
  }

  /** 按主题或错题拉取公式/公理/定理/解题思路 */
  async fetchKnowledgeFormulas(params: {
    subjectName: string | null
    topic: string
    stemText: string
    analysisText: string
    keyPoints: string
    count: number
  }): Promise<{
    items: Array<{
      kind: 'formula' | 'axiom' | 'theorem' | 'method'
      title: string
      content: string
      tip: string
    }>
    model: string
  }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }
    const count = Math.min(5, Math.max(1, params.count || 3))
    const system = `你是资深高中教师与教材编辑。任务：整理「公式 / 公理 / 定理 / 解题思路」，供学生入库备用，不是出题。
规则：
1. 输出 1~${count} 条；每条含 kind（只能是 formula|axiom|theorem|method）、title（名称≤30字）、content（正文）、tip（易错提醒，可空字符串）。
2. 公式/定理的 content 必须写清表达式：优先用 LaTeX，行内用 $...$，独立公式用 $$...$$；也可用纯文本如 F=ma。
3. method 写简短解题思路步骤，不要抄整道题。
4. 面向高中范围，内容须准确；不确定处在 tip 中说明。
5. 禁止 Markdown 代码围栏；只输出合法 JSON：
{"items":[{"kind":"formula","title":"...","content":"...","tip":"..."}]}`
    const user = `科目：${params.subjectName || '未知'}
主题关键词：${params.topic || '（无，请根据错题提炼）'}
数量：最多 ${count} 条

【错题题干】
${(params.stemText || '').slice(0, 2500) || '（无）'}

【解析】
${(params.analysisText || '').slice(0, 1800) || '（无）'}

【要点】
${(params.keyPoints || '').slice(0, 800) || '（无）'}

请列出本题或该主题会用到的公式、公理、定理或解题思路。只输出 JSON。`

    const model = this.model()
    let content = await this.chat({
      key,
      model,
      system,
      user,
      temperature: 0.4,
    })
    let items = this.parseKnowledgeFormulas(content)
    if (!items.length) {
      content = await this.chat({
        key,
        model,
        system: system + '\n上次无法解析。本次务必输出完整 JSON 对象。',
        user,
        temperature: 0.2,
      })
      items = this.parseKnowledgeFormulas(content)
    }
    if (!items.length && content) {
      items = this.parseKnowledgeFormulas(this.repairJsonBackslashes(content))
    }
    if (!items.length) {
      throw new ServiceUnavailableException(
        'AI 未能整理出可用公式/定理，请换关键词或手动新建',
      )
    }
    return { items: items.slice(0, count), model }
  }

  private parseKnowledgeFormulas(content: string): Array<{
    kind: 'formula' | 'axiom' | 'theorem' | 'method'
    title: string
    content: string
    tip: string
  }> {
    const kinds = new Set(['formula', 'axiom', 'theorem', 'method'])
    const candidates = this.extractJsonCandidates(content)
    for (const text of candidates) {
      try {
        const obj = JSON.parse(text) as {
          items?: Array<{
            kind?: string
            title?: string
            content?: string
            tip?: string
          }>
        }
        const raw = Array.isArray(obj?.items) ? obj.items : []
        const items = raw
          .map((it) => {
            const kindRaw = String(it?.kind || 'method').trim()
            const kind = (kinds.has(kindRaw) ? kindRaw : 'method') as
              | 'formula'
              | 'axiom'
              | 'theorem'
              | 'method'
            return {
              kind,
              title: String(it?.title || '').trim().slice(0, 128),
              content: String(it?.content || '').trim(),
              tip: String(it?.tip || '').trim().slice(0, 255),
            }
          })
          .filter((it) => it.title && it.content)
        if (items.length) return items
      } catch {
        // next
      }
    }
    return []
  }

  /** 电子宠物闲聊：非 JSON，多轮短回复 */
  async petChat(params: {
    skinName: string
    personality: string
    message: string
    history: Array<{ role: 'user' | 'assistant'; content: string }>
    context?: string
  }): Promise<{ reply: string; model: string }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }
    const model = this.model()
    const system = [
      `你是学习系统里的电子宠物「${params.skinName}」。`,
      `人设：${params.personality}。`,
      '用中文短句回复，每次不超过 80 字，口语、友善、可适度卖萌。',
      '可以鼓励学习、聊错题复习，但不要编造用户的成绩或积分数据。',
      '不要输出 JSON、Markdown 代码块或长篇论文。',
      params.context ? `当前页面上下文：${params.context}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: system },
      ...params.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: params.message },
    ]

    const { content: reply } = await this.chatMessages({
      key,
      model,
      messages,
      temperature: 0.7,
      forceJson: false,
      maxTokens: 256,
    })
    if (!reply.trim()) {
      throw new ServiceUnavailableException('模型未返回有效回复，请稍后重试')
    }
    return { reply: reply.trim().slice(0, 500), model }
  }

  /**
   * APPLICATION-3A：高一数学纯文字应用题批改（原始 JSON 字符串）。
   * 调用方须自行做 rubric 严格校验；本方法不落库、不记录学生全文到日志。
   * 需显式 timeoutMs；失败抛 ServiceUnavailableException（含超时）。
   */
  async gradeHsMathApplicationText(params: {
    system: string
    user: string
    timeoutMs: number
  }): Promise<{
    content: string
    model: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    } | null
  }> {
    const key = this.apiKey()
    if (!key) {
      throw new ServiceUnavailableException(
        '未配置 DEEPSEEK_API_KEY，请在 apps/api/.env 中填写',
      )
    }
    const model = this.model()
    const { content, usage } = await this.chatMessages({
      key,
      model,
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
      temperature: 0.2,
      forceJson: !this.isReasoningModel(model),
      timeoutMs: params.timeoutMs,
      withUsage: true,
    })
    if (!content.trim()) {
      throw new ServiceUnavailableException('模型未返回有效批改 JSON')
    }
    return { content, model, usage: usage ?? null }
  }

  private async chat(opts: {
    key: string
    model: string
    system: string
    user: string
    temperature: number
    timeoutMs?: number
  }): Promise<string> {
    const { content } = await this.chatMessages({
      key: opts.key,
      model: opts.model,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      temperature: opts.temperature,
      forceJson: !this.isReasoningModel(opts.model),
      timeoutMs: opts.timeoutMs,
    })
    return content
  }

  private async chatMessages(opts: {
    key: string
    model: string
    messages: Array<{ role: string; content: string }>
    temperature: number
    forceJson: boolean
    maxTokens?: number
    timeoutMs?: number
    withUsage?: boolean
  }): Promise<{
    content: string
    usage?: {
      prompt_tokens?: number
      completion_tokens?: number
      total_tokens?: number
    } | null
  }> {
    const reasoning = this.isReasoningModel(opts.model)
    const maxTokens =
      opts.maxTokens ?? (reasoning ? 8192 : 4096)
    let res: Response
    const ac =
      typeof opts.timeoutMs === 'number' && opts.timeoutMs > 0
        ? new AbortController()
        : null
    let timer: ReturnType<typeof setTimeout> | null = null
    if (ac) {
      timer = setTimeout(() => ac.abort(), opts.timeoutMs)
    }
    try {
      const body: Record<string, unknown> = {
        model: opts.model,
        messages: opts.messages,
        temperature: opts.temperature,
        max_tokens: maxTokens,
      }
      // 非推理模型可强制 JSON；flash/reasoner 部分不支持或会冲突
      if (opts.forceJson && !reasoning) {
        body.response_format = { type: 'json_object' }
      }
      res = await fetch(`${this.baseUrl()}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${opts.key}`,
        },
        body: JSON.stringify(body),
        signal: ac?.signal,
      })
    } catch (e) {
      const msg = (e as Error).message || String(e)
      const timedOut =
        (e as Error).name === 'AbortError' || /aborted|timeout/i.test(msg)
      throw new ServiceUnavailableException(
        timedOut
          ? `调用 DeepSeek 超时（${opts.timeoutMs}ms）`
          : `调用 DeepSeek 失败: ${msg}`,
      )
    } finally {
      if (timer) clearTimeout(timer)
    }

    const raw = (await res.json()) as {
      error?: { message?: string }
      usage?: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
      }
      choices?: Array<{
        message?: { content?: string; reasoning_content?: string }
        finish_reason?: string
      }>
    }
    if (!res.ok) {
      throw new ServiceUnavailableException(
        raw.error?.message || `DeepSeek HTTP ${res.status}`,
      )
    }
    const msg = raw.choices?.[0]?.message
    const content = (msg?.content || '').trim()
    const reasoningText = (msg?.reasoning_content || '').trim()
    const usage = opts.withUsage ? raw.usage ?? null : undefined
    // flash 常把正文放在 reasoning_content，content 为空
    if (content) return { content, usage }
    if (reasoningText) return { content: reasoningText, usage }
    return { content: '', usage }
  }

  private parseItems(content: string): AiGeneratedItem[] {
    const candidates = this.extractJsonCandidates(content)
    for (const text of candidates) {
      const items = this.tryParseItems(text)
      if (items.length) return items
    }
    return []
  }

  /** 模型常输出 \frac 未转义成 \\frac，尝试修补后再 JSON.parse */
  private repairJsonBackslashes(content: string): string {
    return content.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
  }

  private extractJsonCandidates(content: string): string[] {
    const out: string[] = []
    const trimmed = (content || '').trim()
    if (!trimmed) return out

    const noFence = trimmed
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim()
    out.push(noFence)
    if (trimmed !== noFence) out.push(trimmed)

    for (const src of [noFence, trimmed]) {
      const obj = this.sliceBalanced(src, '{', '}')
      if (obj) out.push(obj)
      const arr = this.sliceBalanced(src, '[', ']')
      if (arr) out.push(arr)
      // 从长推理文本中找含 items 的对象
      const idx = src.indexOf('"items"')
      if (idx >= 0) {
        const brace = src.lastIndexOf('{', idx)
        if (brace >= 0) {
          const sliced = this.sliceBalanced(src.slice(brace), '{', '}')
          if (sliced) out.push(sliced)
        }
      }
    }

    return [...new Set(out.filter(Boolean))]
  }

  private sliceBalanced(src: string, open: string, close: string): string | null {
    const start = src.indexOf(open)
    if (start < 0) return null
    let depth = 0
    let inStr = false
    let esc = false
    for (let i = start; i < src.length; i++) {
      const ch = src[i]
      if (inStr) {
        if (esc) {
          esc = false
        } else if (ch === '\\') {
          esc = true
        } else if (ch === '"') {
          inStr = false
        }
        continue
      }
      if (ch === '"') {
        inStr = true
        continue
      }
      if (ch === open) depth++
      else if (ch === close) {
        depth--
        if (depth === 0) return src.slice(start, i + 1)
      }
    }
    return null
  }

  private tryParseItems(text: string): AiGeneratedItem[] {
    const attempts = [text, this.repairJsonBackslashes(text)]
    for (const candidate of attempts) {
      try {
        const parsed = JSON.parse(candidate) as
          | { items?: Array<Record<string, unknown>> }
          | Array<Record<string, unknown>>
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.items)
            ? parsed.items
            : []
        const items = list
          .map((it) => ({
            stemText: String(it.stemText || it.stem || '').trim(),
            answerText: String(it.answerText || it.answer || '').trim(),
            analysisText: String(it.analysisText || it.analysis || '').trim(),
          }))
          .filter((it) => it.stemText.length > 0)
        if (items.length) return items
      } catch {
        // try next
      }
    }
    return []
  }
}
