import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

// System categories with their codes
const CATEGORY_CODES = {
  'CAMERA': 'CAM',
  'LENS': 'LEN',
  'LIGHTING': 'LIT',
  'AUDIO': 'AUD',
  'COMPUTER': 'COM',
  'STORAGE': 'STO',
  'ACCESSORY': 'ACC',
  'FURNITURE': 'FUR',
  'SOFTWARE': 'SOF',
  'INFORMATION_TECHNOLOGY': 'ITE',
  'HEADSET': 'HED',
  'OTHER': 'OTH'
}

async function main() {
  console.log('🔄 Adding category codes...')

  // First, add the code column with a temporary default
  await prisma.$executeRaw`ALTER TABLE custom_categories ADD COLUMN IF NOT EXISTS code TEXT`

  // Update existing categories with their codes
  for (const [id, code] of Object.entries(CATEGORY_CODES)) {
    const result = await prisma.$executeRaw`
      UPDATE custom_categories
      SET code = ${code}
      WHERE id = ${id}
    `
    if (result > 0) {
      console.log(`  ✅ ${id} → ${code}`)
    }
  }

  // Now add the unique constraint
  await prisma.$executeRaw`ALTER TABLE custom_categories ADD CONSTRAINT custom_categories_code_key UNIQUE (code)`

  console.log('✨ Category codes added successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
