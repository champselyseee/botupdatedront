import { BACKEND_URL } from './config'
import type {
  AttachedFile,
  CheckTokenResponse,
  OcrResponse,
  ProxyResponse,
  WorkType,
} from './types'

/** Проверка токена при старте. Возвращает true, если токен валиден. */
export async function checkToken(token: string, signal?: AbortSignal): Promise<boolean> {
  const res = await fetch(`${BACKEND_URL}/check_token?token=${encodeURIComponent(token)}`, {
    signal,
  })
  const data = (await res.json()) as CheckTokenResponse
  return Boolean(data.ok)
}

export interface ProxyPayload {
  token: string
  type: WorkType
  text: string
  photos: string[]
  file: AttachedFile | null
}

/**
 * Основная проверка работы. Сжигает токен на бэкенде.
 * Бросает Error с текстом из поля `error` бэкенда либо `HTTP <status>`.
 */
export async function submitProxy(payload: ProxyPayload): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data: ProxyResponse = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data.answer ?? ''
}

/**
 * OCR одного фото рукописи. Токен проверяется, но НЕ сжигается.
 * Бросает Error с человекочитаемым текстом при неудаче.
 */
export async function recognizePhoto(token: string, photo: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/ocr`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, photo }),
  })
  const data: OcrResponse = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return (data.text ?? '').trim()
}
