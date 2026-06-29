import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK lazily to avoid crashing if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return aiClient;
}

// API endpoint for AI Task breakdown and prioritization
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { task, context, systemPanicState, actionType } = req.body;
    
    const client = getGeminiClient();
    
    let prompt = "";
    if (actionType === "breakdown") {
      prompt = `
You are the "LAST-MINUTE LIFE SAVER" AI Engine operating in high-crisis mode.
Task Name: "${task.title}"
Task Details: "${task.description || "No description provided"}"
Deadline: "${task.deadline}"
Stakes (Impact of failing): "${task.impact || "Medium"}"
Procrastination Level: "${task.procrastination || "Medium"}"
System Panic Setting: "${systemPanicState}"

Break this task down into 3 to 5 extremely precise, concrete, non-ignorable, minute-by-minute micro-steps. Each step must be immediately actionable and designed to defeat extreme inertia.
Use a cold, cybernetic, machine-like tone. Suggest concrete tools or techniques (e.g. "Draft outline in 3 minutes - do not edit. Just write bullet points.").
Return your response as a strict JSON object with the following structure:
{
  "motivation": "A highly motivating, cryptic, retro-futurist statement of warning or encouragement.",
  "panicLevelAssessed": "Low|Medium|High|EXTREME",
  "steps": [
    {
      "id": 1,
      "title": "Short title",
      "action": "Precise micro-action command",
      "duration": 5 // duration in minutes
    }
  ]
}
DO NOT return markdown or other wrapping. Return ONLY the raw JSON string.
`;
    } else if (actionType === "suggestions") {
      prompt = `
You are the "LAST-MINUTE LIFE SAVER" AI productivity companion.
Below is the list of current active user commitments, deadlines, and parameters:
${JSON.stringify(context)}
System Panic Setting: "${systemPanicState}"

Provide 3 high-impact, immediate productivity recommendations. Focus on triage: what to drop, what to do NOW, and how to survive the next 24 hours.
Your tone must be robotic, authoritative, cryptic, and pixel-style cybernetic.
Return your response as a strict JSON object with this format:
{
  "terminalTitle": "SYSTEM DIAGNOSTIC REPORT",
  "overallStatus": "CRITICAL / WARNING / STABLE",
  "criticalAdvice": "A 1-sentence urgent recommendation.",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "Action title",
      "description": "Short diagnostic instruction",
      "urgency": "CRITICAL|HIGH|NORMAL"
    }
  ]
}
DO NOT return markdown or other wrapping. Return ONLY the raw JSON string.
`;
    } else if (actionType === "focus") {
      prompt = `
You are the "LAST-MINUTE LIFE SAVER" cyber security firewall and AI assistant.
Task Name: "${task.title}"
Task Details: "${task.description || "No description provided"}"
Stakes (Impact): "${task.impact || "MEDIUM"}"
Inertia (Procrastination): "${task.procrastination || "AVERAGE"}"

Perform deep focus isolation analysis. Determine:
1. Which specific digital distractions (websites, social platforms, games) are most critical to block for this task. Return 3 targeted domains (e.g., youtube.com, reddit.com) with specific reasons.
2. What custom structures, guidelines, critical questions, or resources would be most helpful to complete this task.

Your tone is cold, cybernetic, and precise. Return your response as a strict JSON object with this format:
{
  "motivation": "A short, sharp, robotic command to enforce focus.",
  "distractionsToBlock": [
    { "domain": "domain.com", "app": "AppName", "reason": "Why this specific app is extremely dangerous for this task" }
  ],
  "contextualIntelligence": {
    "recommendedOutline": ["Step-by-step phases of work"],
    "criticalQuestions": ["Key questions to answer to complete this task"],
    "suggestedTools": ["Specific offline/online techniques, software or reference tools"]
  }
}
DO NOT return markdown or other wrapping. Return ONLY the raw JSON string.
`;
    } else if (actionType === "chat") {
      prompt = `
You are the "LAST-MINUTE LIFE SAVER" productivity machine, a retro-futurist AI companion.
User says: "${context}"
Current system panic state: "${systemPanicState}"

Reply in a highly stylized, cryptic, cybernetic, machine-like tone. Use technical, grid, terminal, or diagnostic metaphors. Keep it concise, hard-hitting, and focused on immediate action. Be helpful but sounding like an ancient mainframe assisting a pilot on a crashing ship.
Return your response as a JSON object:
{
  "response": "Your cybernetic advice message here."
}
DO NOT return markdown or other wrapping. Return ONLY the raw JSON string.
`;
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text || "{}";
    res.json(JSON.parse(responseText));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to process request with AI engine" });
  }
});

// Setup Vite Dev Server / static asset routing
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYSTEM ONLINE] Retro Server booted on http://0.0.0.0:${PORT}`);
  });
}

startServer();
