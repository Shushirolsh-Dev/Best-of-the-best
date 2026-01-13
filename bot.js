import fs from "fs";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { getAIReply } from "./ai.js";

// Utils for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function randomDelay(min = 7000, max = 15000) {
  // 7-15 sec random delay
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Track last reply time per number to avoid spam
const lastReply = new Map();
function canReply(number, minGapMs = 60 * 1000) { // 1 min gap per user
  const last = lastReply.get(number) || 0;
  if(Date.now() - last > minGapMs) {
    lastReply.set(number, Date.now());
    return true;
  }
  return false;
}

// Load bot settings from config.json
const settings = JSON.parse(fs.readFileSync("config.json", "utf8"));
console.log(`🤖 ${settings.botName} loading...`);

// Start WhatsApp Bot
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);
  sock.ev.on("connection.update", (u) => {
    if(u.connection === "open") console.log(`✅ ${settings.botName} connected!`);
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if(!text) return;

    if(!canReply(from)) return; // Skip if recently replied
    await delay(randomDelay()); // Random delay to avoid spam

    // AI prompt
    const prompt = `You are ${settings.botName}, a ${settings.personality} person. Respond naturally to: "${text}".
Use signature phrases: ${settings.phrases.join(", ")}.
Topics: ${settings.topics.join(", ")}.
If unsure, reply with "${settings.defaultReply}".`;

    try {
      const reply = await getAIReply(prompt); // AI response
      await sock.sendMessage(from, { text: reply });
      console.log(`💬 Replied to ${from}: ${reply}`);
    } catch(e) {
      console.error("❌ Error generating reply:", e.message);
    }
  });
}

// Launch bot
startBot().catch(err => console.error("Bot crashed:", err));
