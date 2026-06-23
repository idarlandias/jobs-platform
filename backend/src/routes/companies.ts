import { Hono } from 'hono'
import { prisma } from '../lib/prisma'
import { authMiddleware } from '../middleware/auth'

const app = new Hono()

// GET /api/v1/companies/me - Fetch logged-in company profile
app.get('/me', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas possuem perfil de empresa.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        _count: { select: { jobs: true } },
      },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    return c.json({ company })
  } catch (error: any) {
    console.error('Get company profile error:', error)
    return c.json({ error: 'Erro ao buscar perfil da empresa: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// PUT /api/v1/companies/profile - Update company profile (Company only)
app.put('/profile', authMiddleware, async (c) => {
  try {
    const user = c.get('user')
    if (user.role !== 'COMPANY') {
      return c.json({ error: 'Apenas empresas podem atualizar o perfil.', code: 'FORBIDDEN' }, 403)
    }

    const company = await prisma.company.findUnique({
      where: { userId: user.userId },
    })

    if (!company) {
      return c.json({ error: 'Perfil de empresa não encontrado.', code: 'NOT_FOUND' }, 404)
    }

    const { name, logoUrl, website, sector, size, description } = await c.req.json()

    const validSizes = ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']
    if (size !== undefined && !validSizes.includes(size)) {
      return c.json({ error: 'Tamanho de empresa inválido.', code: 'BAD_REQUEST' }, 400)
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: name !== undefined ? name : undefined,
        logoUrl: logoUrl !== undefined ? logoUrl : undefined,
        website: website !== undefined ? website : undefined,
        sector: sector !== undefined ? sector : undefined,
        size: size !== undefined ? size : undefined,
        description: description !== undefined ? description : undefined,
      },
    })

    return c.json({ company: updated, message: 'Perfil da empresa atualizado com sucesso!' })
  } catch (error: any) {
    console.error('Update company profile error:', error)
    return c.json({ error: 'Erro ao atualizar perfil da empresa: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

// GET /api/v1/companies/:id - Public company profile + active jobs
app.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        website: true,
        sector: true,
        size: true,
        description: true,
        isVerified: true,
        jobs: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            title: true,
            workplaceType: true,
            workType: true,
            location: true,
            salaryMin: true,
            salaryMax: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!company) {
      return c.json({ error: 'Empresa não encontrada.', code: 'NOT_FOUND' }, 404)
    }

    return c.json({ company })
  } catch (error: any) {
    console.error('Get company error:', error)
    return c.json({ error: 'Erro ao buscar empresa: ' + error.message, code: 'INTERNAL_ERROR' }, 500)
  }
})

export default app
