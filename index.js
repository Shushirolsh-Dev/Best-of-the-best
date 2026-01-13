import express from "express";
import fs from "fs";
import { getAIReply } from "./ai.js";
import { delay, randomDelay, canReply } from "./utils.js";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

// Save settings from frontend
app.post("/save-settings", (req, res) => {
  fs.writeFileSync("config.json", JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

// Load settings
const settings = JSON.parse(fs.readFileSync("config.json", "utf8"));

// WhatsApp Bot
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

    if(!canReply(from)) return;
    await delay(randomDelay());

    // Generate AI reply using personality + topics
    const prompt = `You are ${settings.botName}, a ${settings.personality} person. Respond to: "${text}". 
Use signature phrases: ${settings.phrases.join(", ")}. Topics: ${settings.topics.join(", ")}. 
If unsure, reply with "${settings.defaultReply}".`;

    const reply = await getAIReply(prompt);
    await sock.sendMessage(from, { text: reply });
    console.log(`💬 Replied to ${from}`);
  });
}

startBot();

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
