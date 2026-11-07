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
/**
 * Colours: validated categorical palette, assigned in fixed slot order
 * (colour-blind safe on adjacent pairs). "Other" is a neutral grey.
 * Charts and legends always pair colour with a text label.
 */
export const CROP_CATEGORIES: CropCategory[] = [
  { id: 'paddy', label: 'Paddy', localName: 'ಭತ್ತ', color: '#2a78d6' },
  { id: 'ragi', label: 'Ragi', localName: 'ರಾಗಿ', color: '#eb6834' },
  { id: 'maize', label: 'Maize', localName: 'ಮೆಕ್ಕೆಜೋಳ', color: '#1baf7a' },
  { id: 'jowar', label: 'Jowar', localName: 'ಜೋಳ', color: '#eda100' },
  { id: 'sugarcane', label: 'Sugarcane', localName: 'ಕಬ್ಬು', color: '#e87ba4' },
  { id: 'groundnut', label: 'Groundnut', localName: 'ಕಡಲೆಕಾಯಿ', color: '#008300' },
  { id: 'cotton', label: 'Cotton', localName: 'ಹತ್ತಿ', color: '#6250d6' },
  { id: 'other', label: 'Other / Unknown', localName: 'ಇತರೆ', color: '#8a8a85' },
]

const byId = new Map(CROP_CATEGORIES.map((c) => [c.id, c]))

export function getCrop(id: string): CropCategory {
  return byId.get(id as CropType) ?? byId.get('other')!
}
