import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
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

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log('\n⚠️  IMPORTANT: Prerequisites for restore:');
    console.log('1. Database must be migrated (run: npx prisma migrate deploy)');
    console.log('2. OR run fresh migrations (run: npx prisma migrate reset --force)');
    console.log('\n⚠️  WARNING: This will restore data to your database.');
    console.log('Any existing data may be overwritten!\n');

    // Check if tables exist by trying a simple query
    try {
      await prisma.accountRole.findFirst();
    } catch (error) {
      console.error('\n❌ ERROR: Database tables do not exist!\n');
      console.log('Please run ONE of these commands first:\n');
      console.log('Option 1 - Fresh start (recommended):');
      console.log('  npx prisma migrate reset --force\n');
      console.log('Option 2 - Deploy migrations only:');
      console.log('  npx prisma migrate deploy\n');
      console.log('Then try the restore again.\n');
      process.exit(1);
    }

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { JobCategory, JobTag, Application, SavedJob, Company, JobArrangement, JobType, ...postData } = jobPost;

        await prisma.jobPost.upsert({
          where: { id: postData.id },
          update: postData,
          create: postData,
        });

        // Restore many-to-many relationship with tags
        // The relation is actually implicit in Prisma - we need to use the _JobTagesOnPosts join table
        // For now, skip restoring tag relationships as they can be re-created
        // TODO: Restore tag relationships via direct SQL if needed
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

    // Restore Supabase Storage files
    const backupDir = path.dirname(backupFile);
    const backupFileName = path.basename(backupFile, '.json');
    const timestamp = backupFileName.replace('backup-', '');
    const storageBackupDir = path.join(backupDir, `storage-${timestamp}`);

    if (fs.existsSync(storageBackupDir)) {
      console.log('\n📦 Starting Supabase Storage restore...');
      console.log(`📁 Storage backup directory: ${storageBackupDir}`);

      let uploadedFiles = 0;
      let failedFiles = 0;
      let skippedFiles = 0;

      // Get all documents from restored database
      const documents = data.documents as Array<{ id: number; file_path: string; file_name: string }>;

      if (documents && documents.length > 0) {
        console.log(`Found ${documents.length} documents to restore to Supabase Storage...`);

        for (const doc of documents) {
          try {
            const localFilePath = path.join(storageBackupDir, doc.file_path);

            if (!fs.existsSync(localFilePath)) {
              console.warn(`⚠️  Local file not found: ${localFilePath}`);
              skippedFiles++;
              continue;
            }

            // Read file from local backup
            const fileBuffer = fs.readFileSync(localFilePath);
            const fileType = doc.file_name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

            // Upload to Supabase (upsert to avoid errors if file already exists)
            const { error } = await supabase.storage
              .from('documents')
              .upload(doc.file_path, fileBuffer, {
                contentType: fileType,
                upsert: true // Overwrite if exists
              });

            if (error) {
              console.error(`❌ Failed to upload ${doc.file_path}:`, error.message);
              failedFiles++;
              continue;
            }

            uploadedFiles++;

            // Progress indicator
            if (uploadedFiles % 10 === 0) {
              console.log(`Progress: ${uploadedFiles}/${documents.length} files uploaded...`);
            }
          } catch (error) {
            console.error(`❌ Error restoring file ${doc.file_path}:`, error);
            failedFiles++;
          }
        }

        console.log(`\n✅ Storage restore completed!`);
        console.log(`- Successfully uploaded: ${uploadedFiles} files`);
        console.log(`- Failed uploads: ${failedFiles} files`);
        console.log(`- Skipped (not found): ${skippedFiles} files`);
      } else {
        console.log('ℹ️  No documents found in backup to restore.');
      }
    } else {
      console.log('\nℹ️  No storage backup directory found. Skipping file restore.');
      console.log(`   Expected directory: ${storageBackupDir}`);
    }

    console.log('\n🎉 Full restore completed successfully!');

  } catch (error) {
    console.error('❌ Error restoring database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

restoreDatabase();
