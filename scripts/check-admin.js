const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('Checking admin user...\n');
    
    const user = await prisma.user.findUnique({
      where: { email: 'admin@lsvr.com' }
    });
    
    if (user) {
      console.log('✅ User found:');
      console.log('ID:', user.id);
      console.log('Email:', user.email);
      console.log('Name:', user.name);
      console.log('Role:', user.role);
      console.log('Active:', user.isActive);
      console.log('Has password:', !!user.password);
      console.log('Password hash length:', user.password ? user.password.length : 0);
      
      // Test password verification
      if (user.password) {
        console.log('\n🔍 Testing password verification...');
        const testPassword = 'Admin123!';
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log('Password "Admin123!" is valid:', isValid);
        
        // Also test with wrong password
        const isInvalid = await bcrypt.compare('wrongpassword', user.password);
        console.log('Password "wrongpassword" is valid:', isInvalid);
      }
    } else {
      console.log('❌ No user found with email admin@lsvr.com');
      
      // List all users
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      console.log('\nAll users in database:');
      console.log(allUsers);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();