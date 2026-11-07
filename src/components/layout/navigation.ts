import { FileBarChart2, LayoutDashboard, type LucideIcon, Satellite, ScanSearch, Settings } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  description: string
}

export const DASHBOARD_NAV: NavItem[] = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, description: 'Region summary and dataset status' },
  { to: '/app/classify', label: 'Crop Classification', icon: ScanSearch, description: 'Classify a field from Sentinel-2 data' },
  { to: '/app/explorer', label: 'Satellite Explorer', icon: Satellite, description: 'Map layers and field boundaries' },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart2, description: 'Classification history and export' },
  { to: '/app/settings', label: 'Settings', icon: Settings, description: 'API connection and data sources' },
]
