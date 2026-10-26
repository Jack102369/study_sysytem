/**
 * APPLICATION-3A：纯文字应用题批改 prompt（无网络）。
 */
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

export function buildHsMathApplicationAiGradePrompt(input: {
  stem: string
  standardAnswer: string
  maxScore: number
  rubric: HsMathApplicationRubricItem[]
  studentText: string
}): { system: string; user: string } {
  const rubricLines = input.rubric
    .map(
      (r, i) =>
        `${i + 1}. key="${r.key}" title="${r.title}" maxScore=${r.maxScore}\n   评分标准：${r.criteria}`,
    )
    .join('\n')

  const system = `你是高中数学应用题评分器。任务：按给定 rubric 对学生文字解答逐项评分。
硬性规则：
1. 使用中文批改。
2. 按 rubric 逐项给整数分；允许部分得分。
3. 不因最终答案错误而抹掉正确过程分；不因最终答案正确而默认过程满分。
4. 关注建模、定义域、求解过程与结论；区分计算错误与概念错误。
5. 给出具体错误定位；提供针对该生答案的个性化解析。
6. 只输出一个合法 JSON 对象，不要 Markdown 代码围栏，不要其它前后缀。
7. 不得自行增加、删减或改名 rubric 项目；不得修改题目满分。
8. 对无法确定的内容不得编造识别或推理结果。
9. JSON 形状：
{"totalScore":0,"rubricScores":[{"rubricKey":"...","score":0,"feedback":"..."}],"recognizedWork":"...","errors":["..."],"personalizedExplanation":"...","confidence":0.0}
10. totalScore 必须等于各 rubricScores.score 之和；每项 0≤score≤该项 maxScore；confidence 可选，范围 [0,1]。`

  const user = `【题干】
${input.stem.slice(0, 8000)}

【标准答案】
${input.standardAnswer.slice(0, 6000)}

【题目满分】${input.maxScore}

【评分标准 rubric】
${rubricLines}

【学生文字解答】
${input.studentText.slice(0, 8000)}

请严格按上述 rubric 评分，只输出规定 JSON。`

  return { system, user }
}
