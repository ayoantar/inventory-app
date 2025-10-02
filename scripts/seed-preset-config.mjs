import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

const categories = [
  { name: 'Camera Kit', description: 'Camera equipment and accessories' },
  { name: 'Audio Setup', description: 'Audio recording and playback equipment' },
  { name: 'Lighting Kit', description: 'Lighting equipment for photography and video' },
  { name: 'Conference Setup', description: 'Equipment for conferences and meetings' },
  { name: 'Video Production', description: 'Professional video production equipment' },
  { name: 'Photography', description: 'Photography equipment and accessories' },
  { name: 'Live Streaming', description: 'Equipment for live streaming and broadcasting' },
  { name: 'Event Setup', description: 'General event equipment and setup' }
]

const departments = [
  { name: 'Media Production', description: 'Media and content production team' },
  { name: 'IT', description: 'Information Technology department' },
  { name: 'Marketing', description: 'Marketing and communications team' },
  { name: 'Events', description: 'Events and conferences team' },
  { name: 'Education', description: 'Education and training department' },
  { name: 'Operations', description: 'Operations and logistics team' }
]

async function main() {
  console.log('Seeding preset categories and departments...')

  // Seed categories
  for (const category of categories) {
    await prisma.presetCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
    console.log(`✅ Created/Updated category: ${category.name}`)
  }

  // Seed departments
  for (const department of departments) {
    await prisma.presetDepartment.upsert({
      where: { name: department.name },
      update: {},
      create: department
    })
    console.log(`✅ Created/Updated department: ${department.name}`)
  }

  console.log('\n🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
