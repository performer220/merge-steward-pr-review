const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Reply with exactly: OK" }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 10 },
    }),
  },
);

if (!response.ok) {
  throw new Error(`Gemini API test failed with HTTP ${response.status}: ${await response.text()}`);
}

const payload = await response.json();
const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
if (!text) throw new Error("Gemini accepted the key but returned no text.");

console.log(`Gemini API connection succeeded with ${model}. Response: ${text}`);
