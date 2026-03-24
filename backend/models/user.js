// User model (just for reference; PostgreSQL handles the table)
const pool = require('../db');

const createUser = async (username, email, password) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password, xp, streak) VALUES ($1, $2, $3, 0, 0) RETURNING *',
    [username, email, password]
  );
  return result.rows[0];
};

const getUserByEmail = async (email) => {
  const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  return result.rows[0];
};

module.exports = { createUser, getUserByEmail };