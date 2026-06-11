import type { WorkType } from './types'
import { WORK_TYPES } from './workTypes'

export interface ParsedScore {
  score: number
  max: number | null
}

export interface ParsedCriterion {
  name: string // "К1"
  num: number
  score: number
}

export type SectionTone = 'neutral' | 'warn' | 'good' | 'error'

export interface ResultSection {
  title: string
  body: string
  tone: SectionTone
}

/** Извлекает итоговый балл из текста ответа модели. */
export function parseScore(text: string): ParsedScore | null {
  const patterns: RegExp[] = [
    /итог[:\s]+(\d+)\s*(?:баллов?)?\s*(?:из\s*(\d+))?/i,
    /итого[:\s]+(\d+)\s*(?:из\s*(\d+))?/i,
    /(\d+)\s*(?:баллов?)?\s*из\s*(\d+)/i,
    /(\d+)\/(\d+)/,
  ]
  for (const re of patterns) {
    const m = text.match(re)
    if (m) {
      return { score: parseInt(m[1], 10), max: m[2] ? parseInt(m[2], 10) : null }
    }
  }
  return null
}

/** Извлекает баллы по критериям К1, К2, … (без дублей, минимум 3 — иначе []). */
export function parseCriteria(text: string): ParsedCriterion[] {
  const result: ParsedCriterion[] = []
  const re = /К(\d+)[^\d]*?[:\-–=]\s*(\d+)/g
  const seen = new Set<number>()
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const k = parseInt(m[1], 10)
    if (!seen.has(k)) {
      seen.add(k)
      result.push({ name: `К${k}`, num: k, score: parseInt(m[2], 10) })
    }
  }
  return result.length >= 3 ? result : []
}

export function sectionTone(title: string): SectionTone {
  const t = title.toLowerCase()
  if (/рекоменд|улучш|совет/.test(t)) return 'warn'
  if (/итог|вывод|резюм|хорошо|отлично|сильн/.test(t)) return 'good'
  if (/ошибк|снижен|проблем|слаб/.test(t)) return 'error'
  return 'neutral'
}

/** Делит ответ модели на смысловые секции (эмодзи-нумерация → заголовки → абзацы). */
export function splitSections(text: string): ResultSection[] {
  let raw = text.split(/(?=1️⃣|2️⃣|3️⃣|4️⃣|5️⃣|6️⃣)/)
  if (raw.length <= 1) {
    raw = text.split(/\n(?=#{1,3}\s|К\d|[А-ЯA-Z][А-Яа-яA-Za-z\s]{2,20}:)/)
  }
  if (raw.length <= 1) {
    raw = text.split(/\n\n+/)
  }

  const sections: ResultSection[] = []
  for (const piece of raw) {
    const section = piece.trim()
    if (!section) continue
    const lines = section.split('\n')
    let title = lines[0].replace(/\*\*/g, '').replace(/^#+\s*/, '').trim()
    let content = lines.slice(1).join('\n').replace(/\*\*/g, '').trim()
    if (title.length > 80) {
      content = section.replace(/\*\*/g, '')
      title = ''
    }
    sections.push({
      title,
      body: content || (title ? '' : section.replace(/\*\*/g, '')),
      tone: title ? sectionTone(title) : 'neutral',
    })
  }
  return sections
}

export interface ResultModel {
  score: ParsedScore | null
  maxScore: number | string
  criteria: Array<ParsedCriterion & { max: number | string }>
  sections: ResultSection[]
  resultLabel: string
}

/** Полная модель для экрана результата. */
export function buildResultModel(text: string, type: WorkType): ResultModel {
  const meta = WORK_TYPES[type]
  const score = parseScore(text)
  const maxScore = (score && score.max) || meta.maxScore || '?'
  const criteria = parseCriteria(text).map((c) => ({
    ...c,
    max: meta.criteriaMax[c.num] ?? '?',
  }))
  return {
    score,
    maxScore,
    criteria,
    sections: splitSections(text),
    resultLabel: meta.resultLabel,
  }
}
