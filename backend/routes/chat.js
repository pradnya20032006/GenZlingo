// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

router.post('/', async (req, res) => {
  const { message, language } = req.body;

  try {
    const completion = await groq.chat.completions.create({
     model: "llama-3.3-70b-versatile", // fast & free model
      messages: [
        {
          role: "system",
          content: `You are a helpful language tutor. Answer in a simple way and teach in ${language || 'English'}.`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Groq API error' });
  }
});

module.exports = router;