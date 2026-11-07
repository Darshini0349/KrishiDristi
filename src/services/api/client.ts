import axios, { type AxiosRequestConfig } from 'axios'
import { env, getApiBaseUrl } from '@/config/env'
import { toApiError } from './errors'

/** Single shared Axios instance for the FastAPI backend. */
export const apiClient = axios.create({
  timeout: env.apiTimeoutMs,
  headers: { Accept: 'application/json' },
})

// Resolve the base URL per request so a Settings override applies immediately.
apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl()
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(toApiError(err)),
)

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.get<T>(url, config)
  return res.data
}

export async function apiPost<T, B = unknown>(url: string, body: B, config?: AxiosRequestConfig): Promise<T> {
  const res = await apiClient.post<T>(url, body, config)
  return res.data
}
