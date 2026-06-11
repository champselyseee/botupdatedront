export type WorkType = 'email' | 'essay' | 'composition'

export type Screen =
  | 'checking'
  | 'noaccess'
  | 'form'
  | 'loading'
  | 'result'

export interface AttachedFile {
  name: string
  type: string
  size: number
  data: string // data URL
}

export interface WorkTypeMeta {
  type: WorkType
  icon: string
  title: string
  subtitle: string
  /** Заголовок результата. */
  resultLabel: string
  /** Максимальный итоговый балл. */
  maxScore: number
  /** Максимум по каждому критерию К1..Кn (1-индексация). */
  criteriaMax: Record<number, number>
}

export interface ProxyResponse {
  answer?: string
  error?: string
}

export interface OcrResponse {
  text?: string
  error?: string
}

export interface CheckTokenResponse {
  ok?: boolean
}
