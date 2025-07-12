// Script to create the swaps table
import 'dotenv/config';
import { query } from './lib/db.js';
import fs from 'fs';

async function createSwapsTable() {
  try {
    console.log('Creating swaps table...');
    
    const sql = fs.readFileSync('./create_swaps_table.sql', 'utf8');
    
    // Split SQL statements by semicolon and execute each one
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await query(statement.trim());
        console.log('Executed:', statement.trim().split('\n')[0] + '...');
      }
    }
    
    console.log('Swaps table created successfully!');
  } catch (error) {
    console.error('Error creating swaps table:', error);
  } finally {
    process.exit(0);
  }
}

createSwapsTable();
