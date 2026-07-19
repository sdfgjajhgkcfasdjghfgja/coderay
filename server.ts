import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Indexer } from "./src/indexing/indexer";
import { Retriever } from "./src/engines/retriever";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Gemini Setup
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const indexer = new Indexer();

  // API routes
  app.post("/api/index", async (req, res) => {
    const { files } = req.body; // { path: string, content: string }[]
    for (const file of files) {
      await indexer.indexFile(file.path, file.content);
    }
    res.json({ status: "indexed" });
  });

  app.post("/api/search", async (req, res) => {
    const { query } = req.body;
    const retriever = new Retriever(indexer.getGraph());
    const results = await retriever.search(query);
    res.json({ results });
  });

  app.post("/api/analyze", async (req, res) => {
    const { fileNames } = req.body;
    try {
      const prompt = `Analyze these project files: ${fileNames.join(', ')}. 
      Identify architectural patterns, detect anti-patterns, evaluate scalability and maintainability, and suggest architectural improvements.
      Also, briefly identify potential risks, tech debt, and bottlenecks.`;
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
    const { messages, query } = req.body;
    
    try {
      const retriever = new Retriever(indexer.getGraph());
      const contextNodes = await retriever.search(query);
      const context = contextNodes.map(n => `File: ${n.filePath}, Symbol: ${n.name}, Type: ${n.type}`).join('\n');
      
      const prompt = `You are an expert AI coding assistant for CodeXRay. You have context about the codebase: ${context}. 
      Current question: ${query}
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
    console.log("Reading:", distPath);
    console.log("Exists:", fs.existsSync(distPath));
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
