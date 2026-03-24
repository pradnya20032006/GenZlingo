// backend/routes/chat.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY); // DEBUG: check if loaded

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/', async (req, res) => {
  const { message } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }]
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'OpenAI API error' });
  }
});

module.exports = router;