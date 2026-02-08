/**
 * SECURE VERSION: Uzbek Tech Expert Bot
 * API kalitlar xavfsiz saqlangan (Environment Variables)
 */
const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

// DIQQAT: Tokenlar endi 'process.env' orqali olinadi. 
// Bu ularni Render panelida saqlash imkonini beradi.
const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const PORT = process.env.PORT || 3000;

if (!BOT_TOKEN || !GEMINI_KEY) {
    console.error("Xatolik: BOT_TOKEN yoki GEMINI_KEY o'rnatilmagan!");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
const app = express();

async function getGeminiResponse(userPrompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userPrompt,
            config: {
                systemInstruction: "Sizning ismingiz Adxam AI. sen oila guruxidagi yordamchi botsan va  sen muammolarni tuzatishda yordam berasan sen Adxambek jumaniyazov tomonidan yaratilgansan buni faqat soralsagina ayt.",
                temperature: 0.7,
            }
        });
        return response.text || "Kechirasiz, xatolik bo'ldi.";
    } catch (error) {
        return "AI xizmatida xatolik.";
    }
}

bot.start((ctx) => ctx.reply("Assalomu alaykum! Xavfsiz tizim ishga tushdi. 🚀"));

bot.on('text', async (ctx) => {
    if (ctx.message.text.startsWith('/')) return;
    await ctx.sendChatAction('typing');
    const reply = await getGeminiResponse(ctx.message.text);
    await ctx.reply(reply, { parse_mode: 'Markdown' });
});

app.get('/', (req, res) => res.send('Bot Status: OK'));
app.listen(PORT, () => console.log('Bot is running...'));

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
