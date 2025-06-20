const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ WhatsApp Bot is ready!');
});

client.on('message', async (msg) => {
  if (!msg.from.endsWith('@g.us')) return; // Only group messages

  const userMessage = msg.body;

  const rules = `
1. No hate speech
2. No abusive or disrespectful language
3. No spam or forward chains
4. Be respectful to others
  `;

  const prompt = `
Group Rules:\n${rules}\n\nMessage: "${userMessage}"\n\nDoes this message break any rule? Answer in JSON like:\n{ "violation": true, "broken_rule": "Reason here" }
  `;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: "llama3-70b-8192",
        messages: [
          { role: "system", content: "You are a strict group moderator." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const result = response.data.choices[0].message.content.trim();
    console.log(`Groq's response: ${result}`);

    if (result.toLowerCase().includes('"violation": true')) {
      await msg.delete(true); // Deletes the message
      msg.reply("🚫 Message violated group rules and was deleted.");
    }

  } catch (err) {
    console.error("Groq API error:", err.message);
  }
});

client.initialize();
