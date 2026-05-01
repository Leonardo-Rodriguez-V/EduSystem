const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function addColumn() {
    try {
        await pool.query(`
            ALTER TABLE apoderado_alumno 
            ADD COLUMN IF NOT EXISTS parentesco TEXT DEFAULT 'Apoderado'
        `);
        console.log('✅ Column parentesco added to apoderado_alumno');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await pool.end();
    }
}

addColumn();
