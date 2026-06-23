import { sign, verify } from 'hono/jwt'

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production'

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await Bun.password.verify(password, hash)
}

export async function generateToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  // Token expires in 7 days
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  return await sign({ ...payload, exp }, JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    return (await verify(token, JWT_SECRET, 'HS256')) as any
  } catch (_) {
    return null
  }
}
