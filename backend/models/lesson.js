const pool = require('../db');

const getAllLessons = async () => {
  const result = await pool.query('SELECT * FROM lessons ORDER BY id');
  return result.rows;
};

module.exports = { getAllLessons };