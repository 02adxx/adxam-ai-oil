/**
 * STABLE VERSION: "Bad Request: can't parse entities" xatoligi tuzatilgan.
 */
const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
const GEMINI_KEY = process.env.GEMINI_KEY;
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
const app = express();

// --- 1. GLOBAL XATOLIKLARNI TUTISH ---
// Bot xatolik tufayli o'chib qolmasligi uchun majburiy:
bot.catch((err, ctx) => {
    console.error(`CRITICAL: ${ctx.updateType} xatosi:`, err.message);
});

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
        return response.text || "Xatolik yuz berdi.";
    } catch (e) {
        return "AI xizmati vaqtincha band.";
    }
}

// --- 2. XABARNI XAVFSIZ YUBORISH FUNKSIYASI ---
async function safeReply(ctx, text) {
    try {
        // Avval chiroyli Markdown bilan urinib ko'ramiz
        await ctx.reply(text, { parse_mode: 'Markdown' });
    } catch (err) {
        // Agar Markdown xatosi bo'lsa (400 Bad Request), oddiy matn sifatida yuboramiz
        if (err.message.includes('entities')) {
            console.log("Markdown error, sending plain text...");
            await ctx.reply(text);
        } else {
            console.error("Reply Error:", err.message);
        }
    }
}

bot.start((ctx) => ctx.reply("Assalomu alaykum! Bot ishga tushdi."));

bot.on('text', async (ctx) => {
    // Buyruqlarga javob bermaslik (agar kerak bo'lsa)
    if (ctx.message.text.startsWith('/')) return;

    try {
        await ctx.sendChatAction('typing');
        const reply = await getGeminiResponse(ctx.message.text);
        
        // Xabar uzun bo'lsa bo'laklash
        if (reply.length > 4000) {
            const chunks = reply.match(/[\s\S]{1,4000}/g);
            for (const chunk of chunks) {
                await safeReply(ctx, chunk);
            }
        } else {
            await safeReply(ctx, reply);
        }
    } catch (err) {
        console.error("Process Error:", err.message);
    }
});

app.get('/', (req, res) => res.send('Bot is Running Securely!'));
app.listen(PORT, () => console.log('Server is online'));

bot.launch().then(() => console.log('Bot started!'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
