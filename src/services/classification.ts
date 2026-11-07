import type {
  ClassificationRecord,
  ClassificationSummary,
  HistoryQuery,
  PredictRequest,
  PredictResponse,
} from '@/types/classification'
import { apiGet, apiPost } from './api/client'
import { ENDPOINTS } from './api/endpoints'

export function predictCrop(body: PredictRequest, signal?: AbortSignal) {
  // Inference can be slow; allow more time than regular reads.
  return apiPost<PredictResponse, PredictRequest>(ENDPOINTS.predict, body, { signal, timeout: 120_000 })
}

export function fetchClassificationHistory(params: HistoryQuery, signal?: AbortSignal) {
  return apiGet<ClassificationRecord[]>(ENDPOINTS.history, { params, signal })
}

export function fetchClassificationSummary(regionId: string, signal?: AbortSignal) {
  return apiGet<ClassificationSummary>(ENDPOINTS.summary, { params: { region_id: regionId }, signal })
}
