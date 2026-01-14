import fetch from "node-fetch";

// -------------------- API KEYS --------------------
const OPENAI_API_KEY = "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";
const ANTHROPOMORPHIC_API_KEY = "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";
const MISTRALAI_API_KEY = "hak1YsqUeDqbbu5sdz0lBDnUm9iKekwr";
const DEEPSEEK_API_KEY = "sk-bf8cd516973c4a82881108f0c6927908";
const CEREBRAS_API_KEY = "csk-n2e3djj9khp658w88dpcwmvfpct53nyrt6pyjjv2p6jjnrch";
const SAMBANOVA_API_KEY = "201f4ee9-0780-4022-9479-f41839a0f365";
const GEMINI_API_KEY = "AIzaSyBttLyb6mxon21wdJj4THv6zq5aIi936Ac";
const GROQ_API_KEY = "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";

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
