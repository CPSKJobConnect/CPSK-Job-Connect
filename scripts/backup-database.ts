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

async function backupDatabase() {
  try {
    console.log('Starting database backup...');

    const backupDir = path.join(process.cwd(), 'backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    // Fetch all data from all tables
    const data: Record<string, unknown[]> = {
      accountRoles: await prisma.accountRole.findMany(),
      accounts: await prisma.account.findMany(),
      students: await prisma.student.findMany(),
      companies: await prisma.company.findMany(),
      documentTypes: await prisma.documentType.findMany(),
      documents: await prisma.document.findMany(),
      notifications: await prisma.notification.findMany(),
      reports: await prisma.report.findMany(),
      jobTypes: await prisma.jobType.findMany(),
      jobArrangements: await prisma.jobArrangement.findMany(),
      jobCategories: await prisma.jobCategory.findMany(),
      jobTags: await prisma.jobTag.findMany(),
      jobPosts: await prisma.jobPost.findMany({
        include: {
          category: true,
          tags: true,
        },
      }),
      applicationStatuses: await prisma.applicationStatus.findMany(),
      applications: await prisma.application.findMany(),
      sessions: await prisma.session.findMany(),
      verificationTokens: await prisma.verificationToken.findMany(),
    };

    // Try to fetch savedJobs if the table exists
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.savedJobs = await (prisma as any).savedJob.findMany();
    } catch (error) {
      console.log('⚠️  SavedJob table not found, skipping...');
      data.savedJobs = [];
    }

    // Write database backup to file
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    console.log(`✅ Database backup completed!`);
    console.log(`📁 Database backup file: ${backupFile}`);
    console.log('\nDatabase backup summary:');
    console.log(`- Account Roles: ${data.accountRoles?.length || 0}`);
    console.log(`- Accounts: ${data.accounts?.length || 0}`);
    console.log(`- Students: ${data.students?.length || 0}`);
    console.log(`- Companies: ${data.companies?.length || 0}`);
    console.log(`- Document Types: ${data.documentTypes?.length || 0}`);
    console.log(`- Documents: ${data.documents?.length || 0}`);
    console.log(`- Notifications: ${data.notifications?.length || 0}`);
    console.log(`- Reports: ${data.reports?.length || 0}`);
    console.log(`- Job Types: ${data.jobTypes?.length || 0}`);
    console.log(`- Job Arrangements: ${data.jobArrangements?.length || 0}`);
    console.log(`- Job Categories: ${data.jobCategories?.length || 0}`);
    console.log(`- Job Tags: ${data.jobTags?.length || 0}`);
    console.log(`- Job Posts: ${data.jobPosts?.length || 0}`);
    console.log(`- Application Statuses: ${data.applicationStatuses?.length || 0}`);
    console.log(`- Applications: ${data.applications?.length || 0}`);
    console.log(`- Saved Jobs: ${data.savedJobs?.length || 0}`);
    console.log(`- Sessions: ${data.sessions?.length || 0}`);
    console.log(`- Verification Tokens: ${data.verificationTokens?.length || 0}`);

    // Backup Supabase Storage files
    console.log('\n📦 Starting Supabase Storage backup...');
    const storageBackupDir = path.join(backupDir, `storage-${timestamp}`);
    fs.mkdirSync(storageBackupDir, { recursive: true });

    let downloadedFiles = 0;
    let failedFiles = 0;

    // Get all documents from database
    const documents = data.documents as Array<{ id: number; file_path: string; file_name: string }>;

    if (documents.length > 0) {
      console.log(`Found ${documents.length} documents to backup from Supabase Storage...`);

      for (const doc of documents) {
        try {
          // Download file from Supabase
          const { data: fileData, error } = await supabase.storage
            .from('documents')
            .download(doc.file_path);

          if (error) {
            console.error(`❌ Failed to download ${doc.file_path}:`, error.message);
            failedFiles++;
            continue;
          }

          // Create directory structure for the file
          const filePath = path.join(storageBackupDir, doc.file_path);
          const fileDir = path.dirname(filePath);

          if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true });
          }

          // Write file to disk
          const buffer = Buffer.from(await fileData.arrayBuffer());
          fs.writeFileSync(filePath, buffer);

          downloadedFiles++;

          // Progress indicator
          if (downloadedFiles % 10 === 0) {
            console.log(`Progress: ${downloadedFiles}/${documents.length} files downloaded...`);
          }
        } catch (error) {
          console.error(`❌ Error backing up file ${doc.file_path}:`, error);
          failedFiles++;
        }
      }

      console.log(`\n✅ Storage backup completed!`);
      console.log(`📁 Storage backup directory: ${storageBackupDir}`);
      console.log(`- Successfully downloaded: ${downloadedFiles} files`);
      console.log(`- Failed downloads: ${failedFiles} files`);
    } else {
      console.log('ℹ️  No documents found in database to backup.');
    }

    console.log('\n🎉 Full backup completed successfully!');

  } catch (error) {
    console.error('❌ Error backing up database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
