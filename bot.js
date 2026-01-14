import fs from "fs";
import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import qrcode from "qrcode";
import { getAIReply } from "./ai.js";

// -------------------- API KEYS --------------------
const GEMINI_API_KEY = "AIzaSyBttLyb6mxon21wdJj4THv6zq5aIi936Ac";
const GROQ_API_KEY = "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";
const OPENAI_API_KEY = "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";
const ANTHROPOMORPHIC_API_KEY = "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";
const MISTRALAI_API_KEY = "hak1YsqUeDqbbu5sdz0lBDnUm9iKekwr";
const DEEPSEEK_API_KEY = "sk-bf8cd516973c4a82881108f0c6927908";
const CEREBRAS_API_KEY = "csk-n2e3djj9khp658w88dpcwmvfpct53nyrt6pyjjv2p6jjnrch";
const SAMBANOVA_API_KEY = "201f4ee9-0780-4022-9479-f41839a0f365";

// -------------------- UTILS --------------------
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function randomDelay(min = 7000, max = 15000) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const lastReply = new Map();
function canReply(number, minGapMs = 60 * 1000) {
  const last = lastReply.get(number) || 0;
  if(Date.now() - last > minGapMs) { lastReply.set(number, Date.now()); return true; }
  return false;
}

// -------------------- LOAD SETTINGS --------------------
const settings = JSON.parse(fs.readFileSync("config.json", "utf8"));
console.log(`🤖 ${settings.botName} loading...`);
const signature = "🅞🅕🅕🅘🅒🅘🅐🅛 🅛🅘🅣🅗🅔🅡🅐🅛";

// -------------------- OFFLINE TRACKING --------------------
let lastSeen = Date.now();
function updateLastSeen() { lastSeen = Date.now(); }
const BASE_OFFLINE_THRESHOLD = 60_000;

// -------------------- BLOCKED & CONSENT --------------------
let blockedUsers = [];
try { blockedUsers = JSON.parse(fs.readFileSync("blocked.json", "utf8")); } 
catch(e){ console.log("⚠️ blocked.json not found, starting empty"); }

const botConsent = new Map();
const lastBlockedReminder = new Map();

// -------------------- EXPRESS SETUP --------------------
const app = express();
const PORT = process.env.PORT || 3000;
let sock;
let latestQR = "";

// Serve index.html with QR dynamically
app.get("/", (req, res) => {
  let html = fs.readFileSync("index.html", "utf8");
  if(latestQR) {
    html = html.replace("{{QR_CODE}}", `<img src="${latestQR}" alt="Scan QR" />`);
  } else {
    html = html.replace("{{QR_CODE}}", `<p>QR not generated yet, refresh the page after a few seconds</p>`);
  }
  res.send(html);
});

// -------------------- START BOT --------------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    if(update.qr) {
      latestQR = await qrcode.toDataURL(update.qr);
      console.log("📌 QR generated! Open the hosted page to scan.");
    }
    if(update.connection === "open") console.log("✅ Bot connected!");
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message) return;
    const from = msg.key.remoteJid;
    if(msg.key.fromMe) { updateLastSeen(); return; }

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if(!text) return;

    // -------------------- OFFLINE CHECK --------------------
    const offlineThreshold = BASE_OFFLINE_THRESHOLD * (1 + Math.random());
    if(Date.now() - lastSeen < offlineThreshold) return;
    if(!canReply(from)) return;

    // -------------------- BLOCKED FLOW --------------------
    if(blockedUsers.includes(from)) {
      const now = Date.now();
      const lastSent = lastBlockedReminder.get(from) || 0;
      if(now - lastSent > 24*60*60*1000) {
        const reminder = `Hi! Just a friendly reminder: Litheral doesn't want to chat right now 😅.`;
        await sock.sendMessage(from, { text: reminder });
        lastBlockedReminder.set(from, now);
        console.log(`🚫 Sent blocked 24h reminder to ${from}`);
      }
      return;
    }

    // -------------------- BOT INTRO & CONSENT --------------------
    if(!botConsent.has(from)) {
      const intro = `Hey! This is a bot. Send YES to chat automatically, NO to wait for Litheral to come online.`;
      await sock.sendMessage(from, { text: intro });
      botConsent.set(from, null);
      return;
    }

    const userConsent = text.trim().toUpperCase();
    if(botConsent.get(from) === null) {
      if(userConsent === "YES") {
        botConsent.set(from, "YES");
        await sock.sendMessage(from, { text: `Awesome! Chatting automatically now 🤖.` });
        return;
      } else if(userConsent === "NO") {
        botConsent.set(from, "NO");
        await sock.sendMessage(from, { text: `Alright! Waiting for Litheral to come online.` });
        return;
      } else {
        await sock.sendMessage(from, { text: `Please reply with YES or NO.` });
        return;
      }
    }

    if(botConsent.get(from) !== "YES") {
      await sock.sendMessage(from, { text: `Waiting for Litheral to come online.` });
      return;
    }

    // -------------------- TYPING & AI --------------------
    await delay(randomDelay(7000,15000));
    const typingTime = Math.min(Math.max(text.length*200, 3000),10000);
    await sock.sendPresenceUpdate("composing", from);
    await delay(typingTime);
    await delay(Math.floor(Math.random()*2000)+500);
    await sock.sendPresenceUpdate("available", from);

    const prompt = `You are ${settings.botName}, a ${settings.personality} person.
Respond naturally to: "${text}".
Use signature phrases: ${settings.phrases.join(", ")}.
Topics: ${settings.topics.join(", ")}.
If unsure, reply with "${settings.defaultReply}".`;

    try {
      const aiReply = await getAIReply(prompt);
      const finalReply = `${aiReply}\n\n${signature}`;
      await sock.sendMessage(from, { text: finalReply });
      console.log(`💬 Replied to ${from}: ${finalReply}`);
    } catch(e) {
      console.error("❌ Error generating reply:", e.message);
    }
  });
}

// -------------------- LAUNCH --------------------
startBot().catch(err => console.error("💥 Bot crashed:", err));
app.listen(PORT, () => console.log(`🌐 QR server running on port ${PORT}`));
