const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool
  .connect()
  .then((client) => {
    console.log('✅ Conexión a PostgreSQL exitosa');
    client.release();
  })
  .catch((error) => {
    console.error('❌ Error al conectar con PostgreSQL:', error.message);
  });

module.exports = pool;
