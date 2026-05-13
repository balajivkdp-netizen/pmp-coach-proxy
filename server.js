const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Serve the HTML app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Proxy to Gemini API (free tier)
app.post("/ask", async (req, res) => {
  try {
    const { system, messages } = req.body;
    const userMessage = messages[0].content;
    const fullPrompt = system ? `${system}\n\n${userMessage}` : userMessage;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        }),
      }
    );
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Return in same format as Anthropic so HTML needs no changes
    res.json({ content: [{ text }] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
