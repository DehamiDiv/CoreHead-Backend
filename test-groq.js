require('dotenv').config();
const { Groq } = require('groq-sdk');
console.log("Key:", process.env.GROQ_API_KEY ? "EXISTS" : "MISSING");
try {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  groq.chat.completions.create({
    messages: [{ role: 'user', content: 'Say hello in 1 word' }],
    model: 'llama-3.1-8b-instant',
  }).then(res => console.log('Response:', res.choices[0].message.content))
    .catch(err => console.error('API Error:', err.message));
} catch (e) {
  console.error("Init error:", e);
}
