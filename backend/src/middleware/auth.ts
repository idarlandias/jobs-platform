import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyToken } from '../lib/authUtils'

export interface AuthUser {
  userId: string
  email: string
  role: 'CANDIDATE' | 'COMPANY' | 'RECRUITER' | 'ADMIN'
}

export async function authMiddleware(c: Context, next: Next) {
  let token = getCookie(c, 'token')

  // Support auth headers as a fallback
  if (!token) {
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    return c.json({ error: 'Não autorizado. Por favor, realize o login.', code: 'UNAUTHORIZED' }, 401)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return c.json({ error: 'Sessão expirada ou inválida. Por favor, realize o login novamente.', code: 'UNAUTHORIZED' }, 401)
  }

  // Set the user in context variables
  c.set('user', payload)
  await next()
}
