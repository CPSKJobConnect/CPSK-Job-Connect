import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function createAdmin() {
  console.log('Creating admin account...');

  const adminEmail = 'admin@cpsk.edu';
  const adminPassword = 'admin123'; // Change this in production!

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.account.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists');
      console.log(`   Email: ${adminEmail}`);
      console.log('   Use this account to log in');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin account
    await prisma.account.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        username: 'Admin',
        role: 3, // Admin role ID
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin account created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  IMPORTANT: Change the admin password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
    throw error;
  }
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
