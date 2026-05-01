const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkSchema() {
    try {
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        const columns = async (tableName) => {
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [tableName]);
            console.log(`Columns in ${tableName}:`, res.rows.map(c => `${c.column_name} (${c.data_type})`));
        };

        await columns('usuarios');
        await columns('cursos');
        await columns('alumnos');
        await columns('apoderado_alumno');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
