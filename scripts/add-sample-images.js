const { PrismaClient } = require('../generated/prisma')

const prisma = new PrismaClient()

const sampleImages = [
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop&crop=center', // Camera
  'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=200&h=200&fit=crop&crop=center', // Lens
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center', // Lighting
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop&crop=center', // Audio
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=200&h=200&fit=crop&crop=center', // Computer
  'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=200&h=200&fit=crop&crop=center', // Storage
  'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=200&h=200&fit=crop&crop=center', // Cable/Accessory
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=200&fit=crop&crop=center', // Equipment
]

async function addSampleImages() {
  try {
    console.log('Adding sample images to assets...')

    // Get all assets without images
    const assets = await prisma.asset.findMany({
      where: {
        imageUrl: null
      },
      select: {
        id: true,
        name: true,
        category: true
      }
    })

    console.log(`Found ${assets.length} assets without images`)

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i]
      const imageUrl = sampleImages[i % sampleImages.length]
      
      await prisma.asset.update({
        where: { id: asset.id },
        data: { imageUrl }
      })

      console.log(`Updated ${asset.name} with image`)
    }

    console.log('Sample images added successfully!')

  } catch (error) {
    console.error('Error adding sample images:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleImages()