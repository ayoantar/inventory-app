const { PrismaClient } = require('./generated/prisma');
const prisma = new PrismaClient();

async function updateAdminEmail() {
  try {
    // Get current admin user
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@lsvr.com' }
    });

    if (adminUser) {
      console.log('Current admin user:', {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email
      });

      console.log('\nWhat email address would you like to use for the admin?');
      console.log('(You can update this directly in the database or through the admin panel)');

      // If you want to update it programmatically, uncomment and modify:
      /*
      const updated = await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          email: 'anthony@lightsailvr.com',  // Replace with your email
          name: 'Anthony'  // Optional: update name too
        }
      });
      console.log('Updated admin user:', updated);
      */
    } else {
      console.log('Admin user not found');
    }

    // Show all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    console.log('\nAll users in database:');
    allUsers.forEach(user => {
      console.log(`- ${user.name || 'No name'} (${user.email}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdminEmail();