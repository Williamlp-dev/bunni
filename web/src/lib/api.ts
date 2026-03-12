import { treaty } from '@elysiajs/eden'
import type { App } from '@server/index'

const PUBLIC_ROUTES = new Set(['/sign-in', '/sign-up', '/forgot-password', '/reset-password'])

const API_URL = import.meta.env.VITE_PUBLIC_API_URL as string

// @ts-ignore - Ignora incompatibilidade de versões do Elysia entre pacotes (mas mantém autocomplete!)
export const api = treaty<App>(API_URL as any, {
  fetch: {
    credentials: 'include',
  },
  onResponse: async (response) => {
    if (response.status === 401 && !PUBLIC_ROUTES.has(window.location.pathname)) {
      window.location.href = '/sign-in'
    }
  },
})
