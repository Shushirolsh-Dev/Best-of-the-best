import fs from "fs";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { getAIReply } from "./ai.js";

// -------------------- UTILS --------------------

// Simple delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Random delay between min and max ms
function randomDelay(min = 7000, max = 15000) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Track last reply per user to prevent spam
const lastReply = new Map();
function canReply(number, minGapMs = 60 * 1000) { // 1 min gap per user
  const last = lastReply.get(number) || 0;
  if(Date.now() - last > minGapMs) {
    lastReply.set(number, Date.now());
    return true;
  }
  return false;
}

// -------------------- LOAD SETTINGS --------------------
const settings = JSON.parse(fs.readFileSync("config.json", "utf8"));
console.log(`🤖 ${settings.botName} loading...`);

// Weird Unicode font for signature (cannot be true red on WhatsApp)
const signature = "🅞🅕🅕🅘🅒🅘🅐🅛 🅛🅘🅣🅗🅔🅡🅐🅛";

// -------------------- OFFLINE TRACKING --------------------
// Track your own last activity (messages you send)
let lastSeen = Date.now();
function updateLastSeen() { lastSeen = Date.now(); }

// Base offline threshold in ms
const BASE_OFFLINE_THRESHOLD = 60_000; // 1 minute

// -------------------- START BOT --------------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const sock = makeWASocket({ auth: state, printQRInTerminal: true });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (u) => {
    if(u.connection === "open") console.log(`✅ ${settings.botName} connected!`);
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if(!msg.message) return;

    const from = msg.key.remoteJid;

    // Update lastSeen if the message is from yourself
    if(msg.key.fromMe) {
      updateLastSeen();
      return;
    }

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if(!text) return;

    // -------------------- OFFLINE CHECK --------------------
    const offlineThreshold = BASE_OFFLINE_THRESHOLD * (1 + Math.random());
    if(Date.now() - lastSeen < offlineThreshold) return;

    // Skip if user recently received a reply
    if(!canReply(from)) return;

    // -------------------- RANDOM THINKING DELAY --------------------
    await delay(randomDelay(7000, 15000));

    // -------------------- TYPING SIMULATION --------------------
    // Simulate typing proportional to message length
    const typingTime = Math.min(Math.max(text.length * 200, 3000), 10000); // 3-10s based on length
    await sock.sendPresenceUpdate("composing", from);
    await delay(typingTime);
    // Random small pause mid-typing to look human
    await delay(Math.floor(Math.random() * 2000) + 500);
    await sock.sendPresenceUpdate("available", from);

    // Build AI prompt
    const prompt = `You are ${settings.botName}, a ${settings.personality} person.
Respond naturally to: "${text}".
Use signature phrases: ${settings.phrases.join(", ")}.
Topics: ${settings.topics.join(", ")}.
If unsure, reply with "${settings.defaultReply}".`;

    try {
      const aiReply = await getAIReply(prompt);

      // Append signature
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
