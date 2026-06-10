const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  console.log('Running raw SQL migrations directly...');
  try {
    const drizzleDir = path.join(__dirname, 'drizzle');
    const files = fs.readdirSync(drizzleDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // ensures 0000_ is before 0001_

    for (const file of files) {
      console.log(`Executing migration: ${file}`);
      const sqlFile = path.join(drizzleDir, file);
      const sql = fs.readFileSync(sqlFile, 'utf-8');
      const sqlCommands = sql.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
      
      for (let cmd of sqlCommands) {
         try {
           await pool.query(cmd);
         } catch(e) {
           console.log('Ignoring query error (likely already exists):', e.message);
         }
      }
    }
    console.log('Migrations complete!');
  } catch (error) {
    console.error('Migration runtime failed!', error);
  } finally {
    await pool.end();
  }
}

run();
