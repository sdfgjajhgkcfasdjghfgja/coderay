import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Indexer } from "./src/indexing/indexer";
import { Retriever } from "./src/engines/retriever";

// Lazy AI Initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY environment variable is required");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cors()); // Basic CORS
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  const PORT = 3000;

  // Global Logger
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  const indexer = new Indexer();

  // API routes
  app.post("/api/index", async (req, res) => {
    try {
      const { files } = req.body;
      if (!Array.isArray(files)) return res.status(400).json({ error: "Invalid input" });
      
      for (const file of files) {
        if (!file.path || !file.content) continue;
        await indexer.indexFile(file.path, file.content);
      }
      res.json({ status: "indexed" });
    } catch (e) {
      console.error("Index error:", e);
      res.status(500).json({ error: "Failed to index files" });
    }
  });

  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) return res.status(400).json({ error: "Query is required" });
      
      const retriever = new Retriever(indexer.getGraph());
      const results = await retriever.search(query);
      res.json({ results });
    } catch (e) {
      console.error("Search error:", e);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { fileNames } = req.body;
      if (!Array.isArray(fileNames)) return res.status(400).json({ error: "fileNames array required" });
      
      const prompt = `Act as an expert software architect. Analyze these project files: ${fileNames.join(', ')}. 
      Identify architectural patterns, detect anti-patterns, evaluate scalability/maintainability, suggest improvements, identify risks, tech debt, and bottlenecks.
      Output in a structured, professional markdown format.`;
      
      const result = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      res.json({ summary: result.text });
    } catch (error) {
      console.error("Analyze error:", error);
      res.status(500).json({ error: "Failed to analyze codebase" });
    }
  });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, query } = req.body;
      if (!query || !Array.isArray(messages)) return res.status(400).json({ error: "Invalid input" });
      
      const retriever = new Retriever(indexer.getGraph());
      const contextNodes = await retriever.search(query);
      
      const context = contextNodes.length > 0 
        ? contextNodes.map(s => `File: ${s.node.filePath}, Symbol: ${s.node.name}, Type: ${s.node.type}`).join('\n')
        : "No relevant codebase context found.";
      
      const prompt = `You are an expert AI coding assistant for CodeXRay. 
      Context about the codebase:
      ${context}

      Question: ${query}
      History: ${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;
      
      const result = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      res.json({ reply: result.text });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to get AI response" });
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal Server Error" });
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
