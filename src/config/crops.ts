import type { CropType } from '@/types/classification'

export interface CropCategory {
  id: CropType
  label: string
  /** Kannada name, shown as secondary text */
  localName: string
  color: string
}

/**
 * Intended crop categories for v1. Inclusion in the trained model is
 * subject to verified ground-truth training data for Mysuru district.
 */
export const CROP_CATEGORIES: CropCategory[] = [
  { id: 'paddy', label: 'Paddy', localName: 'ಭತ್ತ', color: '#2f7fb5' },
  { id: 'ragi', label: 'Ragi', localName: 'ರಾಗಿ', color: '#8a5a3c' },
  { id: 'maize', label: 'Maize', localName: 'ಮೆಕ್ಕೆಜೋಳ', color: '#d9a21b' },
  { id: 'jowar', label: 'Jowar', localName: 'ಜೋಳ', color: '#c4622d' },
  { id: 'sugarcane', label: 'Sugarcane', localName: 'ಕಬ್ಬು', color: '#4f9a3f' },
  { id: 'groundnut', label: 'Groundnut', localName: 'ಕಡಲೆಕಾಯಿ', color: '#9b6fb8' },
  { id: 'cotton', label: 'Cotton', localName: 'ಹತ್ತಿ', color: '#5e7186' },
  { id: 'other', label: 'Other / Unknown', localName: 'ಇತರೆ', color: '#a3a39b' },
]

const byId = new Map(CROP_CATEGORIES.map((c) => [c.id, c]))

export function getCrop(id: string): CropCategory {
  return byId.get(id as CropType) ?? byId.get('other')!
}
