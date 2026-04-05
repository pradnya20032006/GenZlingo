const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');


// Register new user
router.post('/register', async (req, res) => {
  const { username, email, password, avatar } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, avatar)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, avatar, xp, streak`,
      [username, email, hashedPassword, avatar || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(400).json({ error: 'User already exists or invalid data' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      xp: user.xp,
      streak: user.streak
    }});
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;