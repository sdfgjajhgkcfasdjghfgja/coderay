import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  // API routes
  app.post("/api/analyze", async (req, res) => {
    const { fileNames } = req.body;
    try {
      const prompt = `Analyze these project files: ${fileNames.join(', ')}. Identify potential risks, tech debt, and architecture bottlenecks.`;
      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      res.json({ summary: result.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to analyze codebase" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { messages, codebaseContext } = req.body;
    
    try {
      const prompt = `You are an expert AI coding assistant for CodeXRay. You have context about the codebase: ${codebaseContext}. 
      Current conversation: ${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;
      
      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      res.json({ reply: result.text });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
