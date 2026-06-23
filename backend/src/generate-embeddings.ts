import { prisma } from './lib/prisma'
import { generateEmbedding } from './lib/gemini'

async function run() {
  try {
    console.log('Gerando embeddings para vagas existentes...')
    const jobs = await prisma.job.findMany()
    
    for (const job of jobs) {
      console.log(`Gerando para: ${job.title} (${job.id})`)
      const textToEmbed = `${job.title} ${job.description} ${job.skills.join(' ')}`
      const vector = await generateEmbedding(textToEmbed)
      const vectorStr = `[${vector.join(',')}]`
      
      await prisma.$executeRawUnsafe(
        'UPDATE "Job" SET embedding = $1::vector WHERE id = $2;',
        vectorStr,
        job.id
      )
    }
    console.log('Embeddings de vagas atualizados com sucesso!')
  } catch (error) {
    console.error('Erro ao atualizar embeddings:', error)
  } finally {
    process.exit(0)
  }
}

run()
