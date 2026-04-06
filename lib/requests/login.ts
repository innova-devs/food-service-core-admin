import { api } from "@/lib/api"

export const LOGIN_PATH = "/auth/login"

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken?: string
  token?: string
  refreshToken?: string
  expiresIn?: number
  user?: Record<string, unknown>
}

export async function login(credentials: LoginCredentials) {
  const { data } = await api.post<LoginResponse>(LOGIN_PATH, credentials)
  return data
}
