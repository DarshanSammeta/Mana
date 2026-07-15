const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Enterprise Database Backup Script
 * This script performs a pg_dump of the database and manages rotation.
 */

const DB_URL = process.env.DATABASE_URL;
const BACKUP_DIR = path.join(__dirname, '../backups');

if (!DB_URL) {
  console.error("DATABASE_URL environment variable is not set.");
  process.exit(1);
}

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const filename = `mana_events_backup_${timestamp}.sql`;
const filepath = path.join(BACKUP_DIR, filename);

console.log(`Starting database backup to ${filepath}...`);

// Note: This requires pg_dump to be installed on the system
const command = `pg_dump "${DB_URL}" > "${filepath}"`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Backup failed: ${error.message}`);
    return;
  }
  if (stderr) {
    console.warn(`Backup warning: ${stderr}`);
  }

  console.log(`Backup completed successfully: ${filename}`);

  // Retention Policy: Delete backups older than 30 days
  const now = Date.now();
  const retentionPeriod = 30 * 24 * 60 * 60 * 1000;

  fs.readdirSync(BACKUP_DIR).forEach(file => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (now - stats.mtimeMs > retentionPeriod) {
      console.log(`Deleting old backup: ${file}`);
      fs.unlinkSync(filePath);
    }
  });
});
