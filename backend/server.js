require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Smartly Backend running on port ${PORT}`);

  // Non-blocking initial database connectivity check
  pool.getConnection()
    .then((connection) => {
      console.log('Database connected successfully.');
      connection.release();
    })
    .catch((err) => {
      console.warn('[Database Notice]: Database not yet reachable or schema not initialized:', err.code || err.message);
    });
});

module.exports = server;
