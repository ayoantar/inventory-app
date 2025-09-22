const { PrismaClient } = require('../generated/prisma');

async function migrateLocations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Starting location migration...');
    
    // Get all unique non-null location values from assets
    const uniqueLocations = await prisma.asset.findMany({
      where: {
        location: {
          not: null
        }
      },
      select: {
        location: true
      },
      distinct: ['location']
    });
    
    console.log(`📍 Found ${uniqueLocations.length} unique location values`);
    
    const locationsToCreate = [];
    
    for (const asset of uniqueLocations) {
      const locationName = asset.location.trim();
      
      // Skip empty strings
      if (!locationName) continue;
      
      // Parse location name to extract building/room info if possible
      let building = null;
      let room = null;
      let description = null;
      
      // Try to parse LSVR Travel Kit patterns
      if (locationName.includes('LSVR Travel Kit')) {
        building = 'LSVR';
        const match = locationName.match(/#(\d+)/);
        if (match) {
          room = `Travel Kit ${match[1]}`;
        }
        description = 'LSVR Travel Kit for client assignments';
      }
      // Add more parsing logic here for other location patterns
      else if (locationName.toLowerCase().includes('storage')) {
        building = 'Warehouse';
        room = locationName;
        description = 'Equipment storage area';
      }
      else if (locationName.toLowerCase().includes('office')) {
        building = 'Office';
        room = locationName;
        description = 'Office location';
      }
      else {
        // Default: treat as a room name
        room = locationName;
        description = `Location: ${locationName}`;
      }
      
      locationsToCreate.push({
        name: locationName,
        building,
        room,
        description,
        isActive: true
      });
    }
    
    console.log(`📝 Preparing to create ${locationsToCreate.length} location records...`);
    
    // Create location records
    let created = 0;
    let skipped = 0;
    
    for (const locationData of locationsToCreate) {
      try {
        const existingLocation = await prisma.location.findUnique({
          where: { name: locationData.name }
        });
        
        if (existingLocation) {
          console.log(`⚠️  Skipping "${locationData.name}" - already exists`);
          skipped++;
          continue;
        }
        
        await prisma.location.create({
          data: locationData
        });
        
        console.log(`✅ Created location: "${locationData.name}"`);
        created++;
        
      } catch (error) {
        console.error(`❌ Failed to create location "${locationData.name}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration complete!`);
    console.log(`   ✅ Created: ${created} locations`);
    console.log(`   ⚠️  Skipped: ${skipped} locations`);
    
    // Now update assets to use locationId references
    console.log(`\n🔗 Updating asset locationId references...`);
    
    const allLocations = await prisma.location.findMany();
    let updated = 0;
    
    for (const location of allLocations) {
      const assetsToUpdate = await prisma.asset.findMany({
        where: {
          location: location.name,
          locationId: null
        }
      });
      
      if (assetsToUpdate.length > 0) {
        await prisma.asset.updateMany({
          where: {
            location: location.name,
            locationId: null
          },
          data: {
            locationId: location.id
          }
        });
        
        console.log(`🔗 Updated ${assetsToUpdate.length} assets to reference location "${location.name}"`);
        updated += assetsToUpdate.length;
      }
    }
    
    console.log(`\n✨ Final summary:`);
    console.log(`   📍 ${created} new locations created`);
    console.log(`   🔗 ${updated} assets updated with location references`);
    console.log(`   💾 Ready for location management!`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateLocations()
    .then(() => {
      console.log('\n🎯 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateLocations;