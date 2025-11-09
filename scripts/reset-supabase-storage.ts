import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAllFilesRecursively(bucket: string, path: string = ''): Promise<string[]> {
  const allFiles: string[] = [];

  const { data: items, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' }
    });

  if (error) {
    console.error(`Error listing files in ${path}:`, error.message);
    return allFiles;
  }

  if (!items || items.length === 0) {
    return allFiles;
  }

  for (const item of items) {
    const itemPath = path ? `${path}/${item.name}` : item.name;

    if (item.id === null) {
      // It's a folder - recurse into it
      const subFiles = await getAllFilesRecursively(bucket, itemPath);
      allFiles.push(...subFiles);
    } else {
      // It's a file
      allFiles.push(itemPath);
    }
  }

  return allFiles;
}

async function resetStorage() {
  try {
    console.log('🗑️  Starting Supabase Storage reset...');
    console.log('📦 Bucket: documents\n');

    // Get all files recursively
    console.log('📋 Scanning for files...');
    const allFiles = await getAllFilesRecursively('documents');

    if (allFiles.length === 0) {
      console.log('ℹ️  No files found in storage.');
      return;
    }

    console.log(`\n⚠️  Found ${allFiles.length} files to delete.`);
    console.log('⚠️  This action is PERMANENT and cannot be undone!\n');

    // Confirm deletion
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise<string>((resolve) => {
      readline.question('Type "DELETE" to confirm deletion: ', (ans: string) => {
        readline.close();
        resolve(ans);
      });
    });

    if (answer !== 'DELETE') {
      console.log('❌ Deletion cancelled.');
      return;
    }

    console.log('\n🗑️  Deleting files...\n');

    let deleted = 0;
    let failed = 0;

    // Delete in batches of 100
    const batchSize = 100;
    for (let i = 0; i < allFiles.length; i += batchSize) {
      const batch = allFiles.slice(i, i + batchSize);

      const { error } = await supabase.storage
        .from('documents')
        .remove(batch);

      if (error) {
        console.error(`❌ Failed to delete batch ${i / batchSize + 1}:`, error.message);
        failed += batch.length;
      } else {
        deleted += batch.length;
        console.log(`✅ Deleted batch ${i / batchSize + 1}: ${batch.length} files`);
      }

      // Progress indicator
      const progress = Math.round((deleted / allFiles.length) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${deleted}/${allFiles.length} files)`);
    }

    console.log('\n\n✅ Storage reset completed!');
    console.log(`- Successfully deleted: ${deleted} files`);
    console.log(`- Failed: ${failed} files`);

  } catch (error) {
    console.error('❌ Error resetting storage:', error);
    throw error;
  }
}

resetStorage();
