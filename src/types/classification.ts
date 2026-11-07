import type { Polygon } from 'geojson'
import type { FieldFeature } from './geo'

export type CropType =
  | 'paddy'
  | 'ragi'
  | 'maize'
  | 'jowar'
  | 'sugarcane'
  | 'groundnut'
  | 'cotton'
  | 'other'

export type ClassificationStatus = 'completed' | 'no_data' | 'failed' | 'pending'

/** Body of POST /api/classification/predict. */
export interface PredictRequest {
  region_id: string
  observation_date: string
  field: FieldFeature
}

/** Response of POST /api/classification/predict. */
export interface PredictResponse {
  prediction_id: string
  status: ClassificationStatus
  crop_type?: CropType | null
  /** 0–1. Only present when the model actually returns a probability. */
  confidence?: number | null
  /** Optional per-class probabilities from the model. */
  class_probabilities?: Partial<Record<CropType, number>> | null
  model_version?: string | null
  observation_date?: string | null
  field_area_ha?: number | null
  message?: string | null
  created_at?: string | null
}

/** One row of GET /api/classification/history. */
export interface ClassificationRecord extends PredictResponse {
  region_id: string
  geometry?: Polygon | null
}

export interface HistoryQuery {
  region_id?: string
  crop_type?: CropType
  date_from?: string
  date_to?: string
  limit?: number
}

export interface CropDistributionEntry {
  crop_type: CropType
  field_count: number
  area_ha?: number | null
}

/** Response of GET /api/classification/summary. */
export interface ClassificationSummary {
  region_id: string
  total_area_ha?: number | null
  classified_fields?: number | null
  latest_observation_date?: string | null
  model_version?: string | null
  distribution: CropDistributionEntry[]
  dataset?: DatasetStatus | null
}

export interface DatasetStatus {
  training_samples?: number | null
  label_source?: string | null
  label_season?: string | null
  last_updated?: string | null
}
