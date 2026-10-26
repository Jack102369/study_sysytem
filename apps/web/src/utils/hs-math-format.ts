/** 将 0–1 正确率格式化为百分比文案；null → -- */
export function formatAccuracyRatio(accuracy: number | null | undefined): string {
  if (accuracy == null || Number.isNaN(accuracy)) return '--'
  return `${Math.round(accuracy * 1000) / 10}%`
}

export function formatAccuracyPercent(
  percent: number | null | undefined,
): string {
  if (percent == null || Number.isNaN(percent)) return '--'
  return `${percent}%`
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '--'
  const sec = Math.round(ms / 1000)
  if (sec < 60) return `${sec} 秒`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return s ? `${m} 分 ${s} 秒` : `${m} 分钟`
}

/** 高一数学三级难度中文名：1 基础 / 2 提高 / 3 压轴（API 仍用数字） */
export function difficultyLabel(d: number | null | undefined): string {
  if (d === 1) return '基础'
  if (d === 2) return '提高'
  if (d === 3) return '压轴'
  if (d == null) return '未知'
  return `难度${d}`
}

/** 题目来源类型（CORE-1A） */
export function sourceTypeLabel(t: string | null | undefined): string {
  if (t === 'original') return '原创'
  if (t === 'adapted') return '高考真题改编'
  if (t === 'past_exam') return '历年高考真题'
  return t || '—'
}

export function sourceVerificationLabel(s: string | null | undefined): string {
  if (s === 'verified') return '已核实'
  if (s === 'unverified') return '未核实'
  return s || '—'
}

export function sourceLicenseLabel(s: string | null | undefined): string {
  if (s === 'permitted') return '允许使用'
  if (s === 'unknown') return '许可未知'
  if (s === 'restricted') return '限制使用'
  if (s === 'forbidden') return '禁止使用'
  return s || '—'
}

/** 兼容默认：original + unverified + unknown（≠ 已核实原创） */
export function isDefaultSourceCompat(s: {
  sourceType?: string | null
  sourceVerificationStatus?: string | null
  sourceLicenseStatus?: string | null
}): boolean {
  return (
    (s.sourceType || 'original') === 'original' &&
    (s.sourceVerificationStatus || 'unverified') === 'unverified' &&
    (s.sourceLicenseStatus || 'unknown') === 'unknown'
  )
}

/** 来源许可风险文案（展示用；门禁仍以后端为准） */
export function sourceLicenseRiskHint(s: {
  sourceType?: string | null
  sourceVerificationStatus?: string | null
  sourceLicenseStatus?: string | null
}): string | null {
  const type = s.sourceType || 'original'
  const ver = s.sourceVerificationStatus || 'unverified'
  const lic = s.sourceLicenseStatus || 'unknown'
  if (lic === 'forbidden') return '许可状态为禁止使用：不可正式批准到学生池。'
  if (lic === 'restricted') return '许可状态为限制使用：不可正式批准到公开学生池。'
  if (type === 'adapted' || type === 'past_exam') {
    if (ver !== 'verified') return '真题/改编须「已核实」后才能正式批准。'
    if (lic !== 'permitted') return '真题/改编须许可为「允许使用」后才能正式批准。'
  }
  if (isDefaultSourceCompat(s)) {
    return '当前为兼容默认来源（原创·未核实·许可未知），不等于已核实原创。'
  }
  return null
}

export function qtypeLabel(q: string): string {
  if (q === 'single') return '单选'
  if (q === 'multi') return '多选'
  if (q === 'judge') return '判断'
  if (q === 'numeric') return '填空'
  if (q === 'application') return '应用题'
  return q
}

export function sessionStatusLabel(s: string): string {
  if (s === 'completed') return '已完成'
  if (s === 'cancelled') return '已取消'
  return '进行中'
}

export function formatAnswerDisplay(
  qtype: string,
  payload: unknown,
  options?: Array<{ id: string; text: string }> | null,
): string {
  if (!payload || typeof payload !== 'object') return '（未作答）'
  const p = payload as Record<string, unknown>
  if (qtype === 'single' && typeof p.optionId === 'string') {
    const opt = options?.find((o) => o.id === p.optionId)
    return opt ? opt.text : p.optionId
  }
  if (qtype === 'multi' && Array.isArray(p.optionIds)) {
    const ids = p.optionIds.map(String)
    if (!ids.length) return '（未作答）'
    return ids
      .map((id) => options?.find((o) => o.id === id)?.text || id)
      .join('、')
  }
  if (qtype === 'judge' && typeof p.value === 'boolean') {
    return p.value ? '正确' : '错误'
  }
  if (qtype === 'numeric') {
    if (typeof p.input === 'string') return p.input || '（未作答）'
    if (typeof p.value === 'string') return p.value
  }
  if (qtype === 'application') {
    if (typeof p.standardAnswer === 'string') {
      return p.standardAnswer.trim() ? p.standardAnswer : '（无标准答案）'
    }
    const text = typeof p.text === 'string' ? p.text.trim() : ''
    const hasImages =
      Array.isArray(p.imageIds) && p.imageIds.map(String).filter(Boolean).length > 0
    if (text) return p.text as string
    if (hasImages) return '（图片作答）'
    return '（未作答）'
  }
  return JSON.stringify(payload)
}
