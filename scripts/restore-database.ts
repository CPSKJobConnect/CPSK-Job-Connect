import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Use DIRECT_URL to avoid pooler prepared statement conflicts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function restoreDatabase() {
  try {
    const backupFile = process.argv[2];

    if (!backupFile) {
      console.error('❌ Please provide a backup file path');
      console.log('Usage: npm run db:restore <backup-file-path>');
      console.log('Example: npm run db:restore backup/backup-2025-10-17T07-44-02-924Z.json');
      process.exit(1);
    }

    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    console.log('Starting database restore...');
    console.log(`📁 Reading backup file: ${backupFile}`);

    const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    console.log('\n⚠️  WARNING: This will restore data to your database.');
    console.log('Make sure you have run migrations and seeded the database first!\n');

    // Restore data in order (respecting foreign key constraints)

    // 1. Account Roles (if not already seeded)
    if (data.accountRoles && data.accountRoles.length > 0) {
      console.log(`Restoring ${data.accountRoles.length} account roles...`);
      for (const role of data.accountRoles) {
        await prisma.accountRole.upsert({
          where: { id: role.id },
          update: role,
          create: role,
        });
      }
    }

    // 2. Accounts
    if (data.accounts && data.accounts.length > 0) {
      console.log(`Restoring ${data.accounts.length} accounts...`);
      for (const account of data.accounts) {
        await prisma.account.upsert({
          where: { id: account.id },
          update: {
            username: account.username,
            email: account.email,
            password: account.password,
            role: account.role,
            created_at: account.created_at,
            updated_at: account.updated_at,
            emailVerified: account.emailVerified,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            backgroundUrl: account.backgroundUrl,
            logoUrl: account.logoUrl,
          },
          create: account,
        });
      }
    }

    // 3. Students
    if (data.students && data.students.length > 0) {
      console.log(`Restoring ${data.students.length} students...`);
      for (const student of data.students) {
        await prisma.student.upsert({
          where: { id: student.id },
          update: student,
          create: student,
        });
      }
    }

    // 4. Companies
    if (data.companies && data.companies.length > 0) {
      console.log(`Restoring ${data.companies.length} companies...`);
      for (const company of data.companies) {
        await prisma.company.upsert({
          where: { id: company.id },
          update: company,
          create: company,
        });
      }
    }

    // 5. Document Types
    if (data.documentTypes && data.documentTypes.length > 0) {
      console.log(`Restoring ${data.documentTypes.length} document types...`);
      for (const docType of data.documentTypes) {
        await prisma.documentType.upsert({
          where: { id: docType.id },
          update: docType,
          create: docType,
        });
      }
    }

    // 6. Documents
    if (data.documents && data.documents.length > 0) {
      console.log(`Restoring ${data.documents.length} documents...`);
      for (const doc of data.documents) {
        await prisma.document.upsert({
          where: { id: doc.id },
          update: doc,
          create: doc,
        });
      }
    }

    // 7. Job Types
    if (data.jobTypes && data.jobTypes.length > 0) {
      console.log(`Restoring ${data.jobTypes.length} job types...`);
      for (const jobType of data.jobTypes) {
        await prisma.jobType.upsert({
          where: { name: jobType.name },
          update: jobType,
          create: jobType,
        });
      }
    }

    // 8. Job Arrangements
    if (data.jobArrangements && data.jobArrangements.length > 0) {
      console.log(`Restoring ${data.jobArrangements.length} job arrangements...`);
      for (const arrangement of data.jobArrangements) {
        await prisma.jobArrangement.upsert({
          where: { name: arrangement.name },
          update: arrangement,
          create: arrangement,
        });
      }
    }

    // 9. Job Categories
    if (data.jobCategories && data.jobCategories.length > 0) {
      console.log(`Restoring ${data.jobCategories.length} job categories...`);
      for (const category of data.jobCategories) {
        await prisma.jobCategory.upsert({
          where: { name: category.name },
          update: category,
          create: category,
        });
      }
    }

    // 10. Job Tags
    if (data.jobTags && data.jobTags.length > 0) {
      console.log(`Restoring ${data.jobTags.length} job tags...`);
      for (const tag of data.jobTags) {
        await prisma.jobTag.upsert({
          where: { id: tag.id },
          update: { name: tag.name },
          create: tag,
        });
      }
    }

    // 11. Job Posts (without relations first)
    if (data.jobPosts && data.jobPosts.length > 0) {
      console.log(`Restoring ${data.jobPosts.length} job posts...`);
      for (const jobPost of data.jobPosts) {
        // Remove relation fields for initial creation
        const { categories, tags, ...postData } = jobPost;

        await prisma.jobPost.upsert({
          where: { id: postData.id },
          update: postData,
          create: postData,
        });

        // Restore many-to-many relationships
        if (categories && categories.length > 0) {
          await prisma.jobPost.update({
            where: { id: postData.id },
            data: {
              category: {
                connect: { id: categories[0].id }
              },
            },
          });
        }

        if (tags && tags.length > 0) {
          await prisma.jobPost.update({
            where: { id: postData.id },
            data: {
              tags: {
                set: tags.map((tag: { id: number }) => ({ id: tag.id })),
              },
            },
          });
        }
      }
    }

    // 12. Application Statuses
    if (data.applicationStatuses && data.applicationStatuses.length > 0) {
      console.log(`Restoring ${data.applicationStatuses.length} application statuses...`);
      for (const status of data.applicationStatuses) {
        await prisma.applicationStatus.upsert({
          where: { id: status.id },
          update: status,
          create: status,
        });
      }
    }

    // 13. Applications
    if (data.applications && data.applications.length > 0) {
      console.log(`Restoring ${data.applications.length} applications...`);
      for (const application of data.applications) {
        await prisma.application.upsert({
          where: { id: application.id },
          update: application,
          create: application,
        });
      }
    }

    // 14. Saved Jobs
    if (data.savedJobs && data.savedJobs.length > 0) {
      console.log(`Restoring ${data.savedJobs.length} saved jobs...`);
      for (const savedJob of data.savedJobs) {
        await prisma.savedJob.upsert({
          where: {
            student_id_job_post_id: {
              student_id: savedJob.student_id,
              job_post_id: savedJob.job_post_id,
            }
          },
          update: savedJob,
          create: savedJob,
        });
      }
    }

    // 15. Notifications
    if (data.notifications && data.notifications.length > 0) {
      console.log(`Restoring ${data.notifications.length} notifications...`);
      for (const notification of data.notifications) {
        await prisma.notification.upsert({
          where: { id: notification.id },
          update: notification,
          create: notification,
        });
      }
    }

    // 16. Reports
    if (data.reports && data.reports.length > 0) {
      console.log(`Restoring ${data.reports.length} reports...`);
      for (const report of data.reports) {
        await prisma.report.upsert({
          where: { id: report.id },
          update: report,
          create: report,
        });
      }
    }

    console.log('\n✅ Database restore completed successfully!');

  } catch (error) {
    console.error('❌ Error restoring database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
