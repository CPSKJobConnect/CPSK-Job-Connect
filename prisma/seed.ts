import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Use DIRECT_URL for seeding to avoid pooler prepared statement conflicts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('Start seeding...');

  // Seed Account Roles
  const studentRole = await prisma.accountRole.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Student',
    },
  });

  const companyRole = await prisma.accountRole.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Company',
    },
  });

  const adminRole = await prisma.accountRole.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Admin',
    },
  });

  console.log('✅ Account roles seeded');

  // Seed Document Types
  const resumeType = await prisma.documentType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Resume',
    },
  });

  const portfolioType = await prisma.documentType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Portfolio',
    },
  });

  const transcriptType = await prisma.documentType.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Transcript',
    },
  });

  const companyEvidenceType = await prisma.documentType.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Company Evidence',
    },
  });

  console.log('✅ Document types seeded');

  // Seed Application Statuses
  const pendingStatus = await prisma.applicationStatus.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Pending',
    },
  });

  const reviewedStatus = await prisma.applicationStatus.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Reviewed',
    },
  });

  const acceptedStatus = await prisma.applicationStatus.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Accepted',
    },
  });

  const rejectedStatus = await prisma.applicationStatus.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Rejected',
    },
  });

  console.log('✅ Application statuses seeded');

  // Seed Job Types
  const fullTimeType = await prisma.jobType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Full-time',
    },
  });

  const partTimeType = await prisma.jobType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Part-time',
    },
  });

  const internshipType = await prisma.jobType.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Internship',
    },
  });

  const contractType = await prisma.jobType.upsert({
    where: { id: 4 },
    update: {},
    create: {
      id: 4,
      name: 'Contract',
    },
  });

  console.log('✅ Job types seeded');

  // Seed Job Arrangements
  const onsiteArrangement = await prisma.jobArrangement.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'On-site',
    },
  });

  const remoteArrangement = await prisma.jobArrangement.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: 'Remote',
    },
  });

  const hybridArrangement = await prisma.jobArrangement.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: 'Hybrid',
    },
  });

  console.log('✅ Job arrangements seeded');

  // Seed Job Categories
  const categories = [
    'Software Development',
    'Data Science',
    'UI/UX Design',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Customer Support',
    'Product Management',
    'Engineering',
  ];

  for (let i = 0; i < categories.length; i++) {
    await prisma.jobCategory.upsert({
      where: { id: i + 1 },
      update: {},
      create: {
        id: i + 1,
        name: categories[i],
      },
    });
  }

  console.log('✅ Job categories seeded');

  // Seed Default Admin Account
  const adminEmail = 'admin@cpsk.edu';
  const adminPassword = 'admin123'; // Change this in production!

  const existingAdmin = await prisma.account.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.account.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        username: 'Admin',
        role: 3, // Admin role ID
        emailVerified: new Date(),
      },
    });

    console.log('✅ Admin account created');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  IMPORTANT: Change the admin password after first login!');
  } else {
    console.log('ℹ️  Admin account already exists, skipping creation');
  }

  console.log('Seeding finished successfully! 🎉');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
