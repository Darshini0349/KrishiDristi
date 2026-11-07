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

/** model_unavailable: imagery was found and measured, but no trained model is installed yet. */
export type ClassificationStatus = 'completed' | 'no_data' | 'failed' | 'pending' | 'model_unavailable'

/** Real measurements of the field from the Sentinel-2 scene used. */
export interface FieldObservation {
  scene_id: string
  platform?: string | null
  scene_cloud_cover_pct?: number | null
  /** Share of field pixels flagged as cloud / cloud shadow by the Sentinel-2 scene classification. */
  field_cloud_pct?: number | null
  ndvi_mean?: number | null
  ndvi_std?: number | null
  pixel_count?: number | null
}

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
  observation?: FieldObservation | null
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
