import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import {
  isGaokaoReview,
  type WritingCoachSession,
  type WritingReviewLevel,
  type WritingStructureReview,
} from '@/api/writing-coach'
import { formatDateTime } from '@/utils/datetime'

function esc(s: string | null | undefined): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl(s: string | null | undefined): string {
  return esc(s || '—').replace(/\n/g, '<br/>')
}

function levelLabel(level: WritingReviewLevel): string {
  if (level === 'pass') return '合格'
  if (level === 'weak') return '偏弱'
  return '不合格'
}

function safeFileName(session: WritingCoachSession): string {
  const mode = session.reviewMode === 'gaokao' ? '高考评测' : '结构练习'
  const subj = session.subjectTrack === 'chinese' ? '语文' : '英语'
  const tip = (session.topicText || '会话')
    .replace(/\s+/g, ' ')
    .slice(0, 24)
    .replace(/[\\/:*?"<>|]/g, '_')
  return `${subj}-${mode}-${tip}.pdf`
}

function buildInnerHtml(session: WritingCoachSession): string {
  const subj = session.subjectTrack === 'chinese' ? '语文' : '英语'
  const mode = session.reviewMode === 'gaokao' ? '高考评测' : '结构练习'
  const source = session.topicSource === 'ai' ? 'AI 出题' : '自己定'
  const reviewed = session.reviewedAt ? formatDateTime(session.reviewedAt) : '—'
  const draftLabel = session.reviewMode === 'gaokao' ? '全文' : '终稿'

  let reviewHtml = '<div class="empty">尚未评测</div>'
  const r = session.review
  if (r && isGaokaoReview(r)) {
    const dims = r.dimensions
      .map(
        (d) => `
      <div class="card">
        <div class="card-head"><b>${esc(d.label)}</b><span>${d.score} / ${d.fullScore}</span></div>
        <p>${nl(d.comment)}</p>
      </div>`,
      )
      .join('')
    const deductions = r.deductions.length
      ? `<div class="block"><div class="label">扣分点</div><ul>${r.deductions
          .map((x) => `<li>${esc(x)}</li>`)
          .join('')}</ul></div>`
      : ''
    const suggestions = r.suggestions.length
      ? `<div class="block"><div class="label">修改建议</div><ul>${r.suggestions
          .map((x) => `<li>${esc(x)}</li>`)
          .join('')}</ul></div>`
      : ''
    const notes =
      r.modelEssayNotes && r.modelEssayNotes.length
        ? `<ul>${r.modelEssayNotes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
        : ''
    const model = r.modelEssay
      ? `<div class="block"><div class="label">原文升格稿（构句/语法/常用高级词）</div>
         <div class="box">${nl(r.modelEssay)}</div>${notes}</div>`
      : ''
    reviewHtml = `
      <div class="block">
        <div class="title">高考评测 <span class="score">${r.totalScore} / ${r.fullScore} 分</span></div>
        <p class="hint">${nl(r.overall)}</p>
        <div class="grid">${dims}</div>
        ${r.analysis ? `<div class="block"><div class="label">解析</div><p>${nl(r.analysis)}</p></div>` : ''}
        ${deductions}${suggestions}${model}
      </div>`
  } else if (r) {
    const sr = r as WritingStructureReview
    const cards = [
      { label: '扣题', dim: sr.onTopic },
      { label: '证据', dim: sr.evidence },
      { label: '过渡', dim: sr.transition },
    ]
      .map(
        (item) => `
      <div class="card">
        <div class="card-head"><b>${item.label}</b><span>${levelLabel(item.dim.level)}</span></div>
        <p>${nl(item.dim.reason)}</p>
        <p class="suggest">建议：${nl(item.dim.suggestion)}</p>
      </div>`,
      )
      .join('')
    reviewHtml = `
      <div class="block">
        <div class="title">结构点评</div>
        <p class="hint">${nl(sr.overallHint)}</p>
        <div class="grid">${cards}</div>
      </div>`
  }

  const structureBlocks =
    session.reviewMode !== 'gaokao'
      ? `<div class="block"><div class="label">提纲</div><div class="box">${nl(session.outlineText)}</div></div>
         <div class="block"><div class="label">首段</div><div class="box">${nl(session.openingText)}</div></div>`
      : ''

  return `
    <h1>会话详情 · ${esc(subj)} · ${esc(mode)}</h1>
    <div class="meta">
      <div><b>科目</b>${esc(subj)}</div>
      <div><b>模式</b>${esc(mode)}</div>
      <div><b>题目来源</b>${esc(source)}</div>
      <div><b>点评时间</b>${esc(reviewed)}</div>
    </div>
    <div class="block"><div class="label">题目</div><div class="box">${nl(session.topicText)}</div></div>
    <div class="block"><div class="label">写作要求</div><div class="box">${nl(session.topicRequirements)}</div></div>
    ${structureBlocks}
    ${reviewHtml}
    <div class="block"><div class="label">${esc(draftLabel)}</div><div class="box">${nl(session.finalDraftText)}</div></div>
  `
}

const PDF_CSS = `
  * { box-sizing: border-box; }
  .pdf-root {
    margin: 0; padding: 28px 32px; width: 760px;
    font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif;
    font-size: 13px; line-height: 1.65; color: #1f2937; background: #fff;
  }
  h1 { font-size: 18px; margin: 0 0 16px; }
  .meta {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin-bottom: 16px;
    padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb;
  }
  .meta div { font-size: 12px; }
  .meta b { color: #6b7280; margin-right: 6px; font-weight: 600; }
  .block { margin: 14px 0; }
  .title { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  .score { font-weight: 600; color: #b45309; margin-left: 8px; font-size: 13px; }
  .label { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 6px; }
  .box, .hint, p { white-space: pre-wrap; word-break: break-word; }
  .box { padding: 10px 12px; background: #f3f4f6; border-radius: 6px; }
  .hint { color: #4b5563; margin: 0 0 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .card { border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; background: #fff; }
  .card-head { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
  .card p { margin: 4px 0; font-size: 12px; }
  .suggest { color: #2563eb; }
  ul { margin: 6px 0 0; padding-left: 18px; }
  li { margin: 4px 0; }
  .empty { color: #9ca3af; padding: 12px 0; }
`

/** 将会话详情导出为 PDF 并触发浏览器下载 */
export async function downloadWritingCoachPdf(session: WritingCoachSession): Promise<void> {
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:760px;background:#fff;z-index:-1;pointer-events:none;'
  host.innerHTML = `<style>${PDF_CSS}</style><div class="pdf-root">${buildInnerHtml(session)}</div>`
  document.body.appendChild(host)

  try {
    const target = host.querySelector('.pdf-root') as HTMLElement
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 760,
    })

    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 10
    const contentW = pageW - margin * 2
    const imgH = (canvas.height * contentW) / canvas.width
    const pageContentH = pageH - margin * 2

    let heightLeft = imgH
    let position = margin
    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    pdf.addImage(imgData, 'JPEG', margin, position, contentW, imgH)
    heightLeft -= pageContentH

    while (heightLeft > 1) {
      position = margin - (imgH - heightLeft)
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', margin, position, contentW, imgH)
      heightLeft -= pageContentH
    }

    pdf.save(safeFileName(session))
  } finally {
    host.remove()
  }
}
