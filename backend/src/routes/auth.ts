import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { prisma } from '../lib/prisma'
import { hashPassword, comparePassword, generateToken } from '../lib/authUtils'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// POST /api/v1/auth/register
app.post('/register', async (c) => {
  try {
    const { email, password, name, role, cnpj } = await c.req.json()

    if (!email || !password || !name) {
      return c.json({ error: 'E-mail, senha e nome são obrigatórios.', code: 'BAD_REQUEST' }, 400)
    }

    const lowerEmail = email.toLowerCase().trim()

    // Verifies if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    })

    if (existingUser) {
      return c.json({ error: 'Este e-mail já está cadastrado.', code: 'ALREADY_EXISTS' }, 409)
    }

    const userRole = role === 'COMPANY' ? 'COMPANY' : 'CANDIDATE'

    // Additional check for companies
    if (userRole === 'COMPANY') {
      if (!cnpj) {
        return c.json({ error: 'CNPJ é obrigatório para cadastro de empresas.', code: 'BAD_REQUEST' }, 400)
      }
      const existingCnpj = await prisma.company.findUnique({
        where: { cnpj: cnpj.trim() },
      })
      if (existingCnpj) {
        return c.json({ error: 'Este CNPJ já está cadastrado.', code: 'ALREADY_EXISTS' }, 409)
      }
    }

    // Hash the password
    const passwordHash = await hashPassword(password)

    // Save in Database via Transaction
    const user = await prisma.$transaction(async (tx) => {
      // 1. Create Core User
      const newUser = await tx.user.create({
        data: {
          email: lowerEmail,
          name,
          role: userRole,
          passwordHash,
        },
      })

      // 2. Create Role Profile
      if (userRole === 'CANDIDATE') {
        await tx.candidate.create({
          data: {
            userId: newUser.id,
            headline: 'Candidato em busca de novas oportunidades',
          },
        })
      } else if (userRole === 'COMPANY') {
        await tx.company.create({
          data: {
            userId: newUser.id,
            name,
            cnpj: cnpj.trim(),
          },
        })
      }

      return newUser
    })

    // Generate Token
    const token = await generateToken({ userId: user.id, email: user.email, role: user.role })

    // Set secure cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }, 201)

  } catch (error: any) {
    console.error('Registration error:', error)
    return c.json({ error: 'Erro ao registrar usuário: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// POST /api/v1/auth/login
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({ error: 'E-mail e senha são obrigatórios.', code: 'BAD_REQUEST' }, 400)
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.passwordHash) {
      return c.json({ error: 'E-mail ou senha incorretos.', code: 'INVALID_CREDENTIALS' }, 401)
    }

    // Verify password
    const isMatch = await comparePassword(password, user.passwordHash)
    if (!isMatch) {
      return c.json({ error: 'E-mail ou senha incorretos.', code: 'INVALID_CREDENTIALS' }, 401)
    }

    // Generate token
    const token = await generateToken({ userId: user.id, email: user.email, role: user.role })

    // Set Cookie
    setCookie(c, 'token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return c.json({ error: 'Erro ao realizar login: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// POST /api/v1/auth/logout
app.post('/logout', (c) => {
  deleteCookie(c, 'token')
  return c.json({ message: 'Logout realizado com sucesso.' })
})

// GET /api/v1/auth/me
app.get('/me', authMiddleware, async (c) => {
  try {
    const authUser = c.get('user')

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        candidate: {
          select: {
            id: true,
            headline: true,
            skills: true,
            resumeUrl: true,
          },
        },
        company: {
          select: {
            id: true,
            cnpj: true,
            logoUrl: true,
            size: true,
          },
        },
      },
    })

    if (!user) {
      return c.json({ error: 'Usuário não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    return c.json({ user })
  } catch (error: any) {
    console.error('Get profile error:', error)
    return c.json({ error: 'Erro ao carregar dados do usuário: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

export default app
