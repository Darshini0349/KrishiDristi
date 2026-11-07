import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { FieldFeature } from '@/types/geo'

export interface RegionRef {
  id: string
  name: string
  level: string
}

/** The initial (and currently only) geographical scope. */
export const DEFAULT_REGION: RegionRef = { id: 'mysuru', name: 'Mysuru District', level: 'district' }

interface WorkspaceValue {
  region: RegionRef
  setRegion: (r: RegionRef) => void
  /** Field boundary drawn by the user — shared between Classification and Explorer. */
  field: FieldFeature | null
  setField: (f: FieldFeature | null) => void
  observationDate: string | null
  setObservationDate: (d: string | null) => void
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [region, setRegion] = useState<RegionRef>(DEFAULT_REGION)
  const [field, setField] = useState<FieldFeature | null>(null)
  const [observationDate, setObservationDate] = useState<string | null>(null)

  const value = useMemo(
    () => ({ region, setRegion, field, setField, observationDate, setObservationDate }),
    [region, field, observationDate],
  )
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
