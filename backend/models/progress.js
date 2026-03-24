// backend/routes/progress.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if(!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  if(!token) return res.status(401).json({ error: 'Invalid token' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.userId = decoded.id;
    next();
  } catch(err){
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}

// GET /api/progress - return all lessons + completed status for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const lessonsRes = await pool.query('SELECT * FROM lessons ORDER BY id');
    const progressRes = await pool.query('SELECT * FROM progress WHERE user_id=$1', [req.userId]);

    const progressMap = {};
    progressRes.rows.forEach(p => { progressMap[p.lesson_id] = p.completed; });

    const lessonsWithProgress = lessonsRes.rows.map(lesson => ({
      ...lesson,
      completed: progressMap[lesson.id] || false
    }));

    res.json(lessonsWithProgress);
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// POST /api/progress/complete - mark lesson complete
router.post('/complete', authMiddleware, async (req, res) => {
  const { lesson_id } = req.body;
  try {
    // Check if already completed
    const check = await pool.query(
      'SELECT * FROM progress WHERE user_id=$1 AND lesson_id=$2',
      [req.userId, lesson_id]
    );

    if(check.rows.length > 0 && check.rows[0].completed){
      return res.status(400).json({ error: 'Lesson already completed' });
    }

    // Get lesson XP
    const lessonRes = await pool.query('SELECT xp_reward FROM lessons WHERE id=$1', [lesson_id]);
    if(lessonRes.rows.length === 0) return res.status(400).json({ error: 'Lesson not found' });
    const xpReward = lessonRes.rows[0].xp_reward || 0;

    // Insert or update progress
    if(check.rows.length === 0){
      await pool.query(
        'INSERT INTO progress (user_id, lesson_id, completed) VALUES ($1, $2, TRUE)',
        [req.userId, lesson_id]
      );
    } else {
      await pool.query(
        'UPDATE progress SET completed=TRUE WHERE user_id=$1 AND lesson_id=$2',
        [req.userId, lesson_id]
      );
    }

    // Update user XP
    await pool.query('UPDATE users SET xp = xp + $1 WHERE id=$2', [xpReward, req.userId]);

    res.json({ message: 'Lesson completed', xpEarned: xpReward });
  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

module.exports = router;