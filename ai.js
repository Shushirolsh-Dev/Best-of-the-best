import fetch from "node-fetch";
import {
  OPENAI_API_KEY,
  ANTHROPOMORPHIC_API_KEY,
  MISTRALAI_API_KEY,
  DEEPSEEK_API_KEY,
  CEREBRAS_API_KEY,
  SAMBANOVA_API_KEY,
  GEMINI_API_KEY,
  GROQ_API_KEY
} from "./bot.js"; // importing from your bot.js constants

// -------------------- AI REPLY FUNCTION --------------------
export async function getAIReply(prompt, provider = "OPENAI") {
  switch(provider.toUpperCase()) {
    case "OPENAI":
      return await getOpenAIReply(prompt);
    case "ANTHROPOMORPHIC":
      return await getAnthropicReply(prompt);
    case "MISTRALAI":
      return await getMistralReply(prompt);
    case "DEEPSEEK":
      return await getDeepSeekReply(prompt);
    case "CEREBRAS":
      return await getCerebrasReply(prompt);
    case "SAMBANOVA":
      return await getSambanovaReply(prompt);
    default:
      return await getOpenAIReply(prompt);
  }
}

// -------------------- OPENAI --------------------
async function getOpenAIReply(prompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 250
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Hmm, I couldn't think of a reply!";
}

// -------------------- ANTHROPIC --------------------
async function getAnthropicReply(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ANTHROPOMORPHIC_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-v1",
      prompt,
      max_tokens_to_sample: 250
    })
  });
  const data = await res.json();
  return data.completion || "Hmm, I couldn't think of a reply!";
}

// -------------------- MISTRAL --------------------
async function getMistralReply(prompt) {
  const res = await fetch("https://api.mistral.ai/v1/generate", {
    method: "POST",
    headers: { "Authorization": `Bearer ${MISTRALAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: prompt, max_output_tokens: 250 })
  });
  const data = await res.json();
  return data.output?.[0]?.content || "Hmm, I couldn't think of a reply!";
}

// -------------------- DEEPSEEK --------------------
async function getDeepSeekReply(prompt) {
  const res = await fetch("https://api.deepseek.ai/v1/generate", {
    method: "POST",
    headers: { "Authorization": `Bearer ${DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max_tokens: 250 })
  });
  const data = await res.json();
  return data.text || "Hmm, I couldn't think of a reply!";
}

// -------------------- CEREBRAS --------------------
async function getCerebrasReply(prompt) {
  const res = await fetch("https://api.cerebras.net/v1/generate", {
    method: "POST",
    headers: { "Authorization": `Bearer ${CEREBRAS_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max_tokens: 250 })
  });
  const data = await res.json();
  return data.output_text || "Hmm, I couldn't think of a reply!";
}

// -------------------- SAMBANOVA --------------------
async function getSambanovaReply(prompt) {
  const res = await fetch("https://api.sambanova.ai/v1/generate", {
    method: "POST",
    headers: { "Authorization": `Bearer ${SAMBANOVA_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, max_tokens: 250 })
  });
  const data = await res.json();
  return data.text || "Hmm, I couldn't think of a reply!";
}
