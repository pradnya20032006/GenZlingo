const express = require('express'); 
const router = express.Router();
const pool = require('../db'); 

// GET all lessons (without user progress)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lessons ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

module.exports = router;