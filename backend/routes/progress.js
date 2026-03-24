const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// GET user progress
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lessons.id, lessons.title, lessons.category, lessons.meme_url, lessons.phrase, lessons.meaning, lessons.xp_reward, progress.completed
       FROM lessons
       LEFT JOIN progress ON lessons.id = progress.lesson_id AND progress.user_id = $1
       ORDER BY lessons.id`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST: Mark lesson as completed & add XP
router.post('/complete', authMiddleware, async (req, res) => {
  const { lesson_id } = req.body;
  try {
    // Get lesson XP
    const lessonRes = await pool.query('SELECT xp_reward FROM lessons WHERE id=$1', [lesson_id]);
    if (lessonRes.rows.length === 0) return res.status(404).json({ error: 'Lesson not found' });

    const xpReward = lessonRes.rows[0].xp_reward;

    // Insert or update progress
    await pool.query(`
      INSERT INTO progress (user_id, lesson_id, completed)
      VALUES ($1, $2, TRUE)
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed=TRUE
    `, [req.userId, lesson_id]);

    // Update user XP
    await pool.query('UPDATE users SET xp = xp + $1 WHERE id = $2', [xpReward, req.userId]);

    res.json({ message: 'Lesson completed', xpEarned: xpReward });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

module.exports = router;