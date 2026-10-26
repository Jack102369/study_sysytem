/**
 * APPLICATION-3D-5：多模态（文字+图片）应用题批改 prompt（无网络）。
 */
import type { HsMathApplicationRubricItem } from '../types/answer-protocol'

export function buildHsMathApplicationVisionAiGradePrompt(input: {
  stem: string
  standardAnswer: string
  maxScore: number
  rubric: HsMathApplicationRubricItem[]
  studentText?: string | null
  imageCount: number
}): { system: string; user: string } {
  const rubricLines = input.rubric
    .map(
      (r, i) =>
        `${i + 1}. key="${r.key}" title="${r.title}" maxScore=${r.maxScore}\n   评分标准：${r.criteria}`,
    )
    .join('\n')

  const system = `你是高中数学应用题多模态评分器。输入含题干、标准答案、rubric、可选学生文字，以及按顺序排列的学生解答图片。
硬性规则：
1. 使用中文批改。
2. 先识别学生原始解答（手写公式、多步骤推导、函数图象标注）；不得把标准答案当成学生答案。
3. 不得自行补写学生没有写的步骤；看不清的符号必须在 recognitionWarnings 中说明，并设 recognitionUncertain=true。
4. 按 rubric 逐项给整数分；允许部分得分；识别不确定时不得直接打 0 分糊弄——应标 recognitionUncertain=true。
5. 不因最终答案错误抹掉正确过程分；不因最终答案正确默认过程满分。
6. 给出具体错误定位；提供针对该生作答的个性化解析。
7. 只输出一个合法 JSON 对象，不要 Markdown 代码围栏，不要其它前后缀。
8. 不得自行增加、删减或改名 rubric 项目；不得修改题目满分。
9. JSON 形状：
{"totalScore":0,"rubricScores":[{"rubricKey":"...","score":0,"feedback":"..."}],"recognizedWork":"...","errors":["..."],"personalizedExplanation":"...","confidence":0.0,"recognitionUncertain":false,"recognitionWarnings":["..."]}
10. totalScore 必须等于各 rubricScores.score 之和；每项 0≤score≤该项 maxScore；confidence 可选，范围 [0,1]。
11. 图片按消息中标注的「第1张、第2张…」顺序理解多图连续性；勿按文件名或上传时间臆测顺序；图象题仅依据图中可见信息。`

  const textBlock =
    typeof input.studentText === 'string' && input.studentText.trim()
      ? `【学生文字解答】\n${input.studentText.trim().slice(0, 8000)}\n`
      : '【学生文字解答】\n（无）\n'

  const user = `【题干】
${input.stem.slice(0, 8000)}

【标准答案】
${input.standardAnswer.slice(0, 6000)}

【题目满分】${input.maxScore}

【评分标准 rubric】
${rubricLines}

${textBlock}
【学生图片】共 ${input.imageCount} 张。每张图片前有「第N张」文字标注，顺序即学生提交的 imageIds 顺序（与原始文件名无关）。请按该顺序阅读完整推导，结合图片与文字评分，只输出规定 JSON。`

  return { system, user }
}
