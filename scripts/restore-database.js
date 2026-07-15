const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Enterprise Database Restore Script
 * This script restores a database from a pg_dump file.
 * WARNING: This will overwrite the target database.
 */

const DB_URL = process.env.DATABASE_URL;
const backupFile = process.argv[2];

if (!DB_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  process.exit(1);
}

if (!backupFile) {
  console.error("Please provide the path to the backup file.");
  console.log("Usage: node scripts/restore-database.js backups/filename.sql");
  process.exit(1);
}

const filepath = path.resolve(backupFile);

if (!fs.existsSync(filepath)) {
  console.error(`Backup file not found: ${filepath}`);
  process.exit(1);
}

console.log(`Starting database restore from ${filepath}...`);
console.log("WARNING: This will overwrite the current database data.");

// Note: This requires psql to be installed on the system
const command = `psql "${DB_URL}" < "${filepath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Restore failed: ${error.message}`);
    return;
  }
  if (stderr) {
    console.warn(`Restore details/warnings: ${stderr}`);
  }

  console.log(`Restore completed successfully from: ${path.basename(filepath)}`);
});
