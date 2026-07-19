import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Indexer } from "./src/indexing/indexer";
import { ImpactEngine } from "./src/engines/impactEngine";
import { DriftEngine } from "./src/engines/driftEngine";
import { RefactoringEngine } from "./src/engines/refactoringEngine";
import { EvolutionEngine, GitCommitData } from "./src/engines/evolutionEngine";
import { Retriever } from "./src/engines/retriever";
import { AIEngineeringAssistant } from "./src/agents/assistant";
import { ArchitectureRules } from "./src/core/architectureRules";
import { getAI } from "./src/lib/ai";

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
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
  const assistant = new AIEngineeringAssistant(indexer, new Retriever(indexer.getGraph()));

  // API routes
  app.post("/api/assistant/query", async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) return res.status(400).json({ error: "Question is required" });

        const response = await assistant.query(question);
        res.json(response);
    } catch (e) {
        console.error("Assistant error:", e);
        res.status(500).json({ error: "Assistant failed to process query" });
    }
  });

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
      const searchResults = await retriever.search(query);
      
      // Synthesis
      const context = searchResults.map(s => `File: ${s.node.filePath}, Symbol: ${s.node.name}, Documentation: ${s.node.documentation || 'No doc'}`).join('\n\n');
      
      const prompt = `Act as an expert software architect. Based on the following repository context, answer the query: "${query}"

      Context:
      ${context}

      Synthesize a comprehensive response with the following sections:
      - Explanation
      - Relevant Files
      - Important Functions
      - Execution Flow
      - Confidence Score (0.0 - 1.0)

      Keep it concise but technical.`;
      
      const result = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });

      res.json({ analysis: result.text });
    } catch (e) {
      console.error("Search error:", e);
      res.status(500).json({ error: "Failed to search and synthesize" });
    }
  });

  app.post("/api/impact", async (req, res) => {
    try {
        const { filePath, fileContent } = req.body;
        if (!filePath || !fileContent) return res.status(400).json({ error: "filePath and fileContent are required" });

        const graph = indexer.getGraph(); // RepositoryGraph
        const engine = new ImpactEngine(graph);
        const report = await engine.analyze(filePath, fileContent);
        res.json(report);
    } catch (e) {
        console.error("Impact analysis error:", e);
        res.status(500).json({ error: "Failed to perform impact analysis" });
    }
  });

  app.post("/api/drift", async (req, res) => {
    try {
        const { rules }: { rules: ArchitectureRules } = req.body;
        if (!rules) return res.status(400).json({ error: "Architecture rules are required" });

        const graph = indexer.getGraph();
        const engine = new DriftEngine(graph);
        const report = await engine.detect(rules);
        res.json(report);
    } catch (e) {
        console.error("Drift analysis error:", e);
        res.status(500).json({ error: "Failed to detect drift" });
    }
  });

  app.post("/api/refactor/plan", async (req, res) => {
    try {
        const { request } = req.body;
        if (!request) return res.status(400).json({ error: "Refactoring request is required" });

        const engine = new RefactoringEngine();
        const plan = await engine.generatePlan(request);
        res.json(plan);
    } catch (e) {
        console.error("Refactoring plan error:", e);
        res.status(500).json({ error: "Failed to generate refactoring plan" });
    }
  });

  app.post("/api/evolution", async (req, res) => {
    try {
        const { commitData }: { commitData: GitCommitData[] } = req.body;
        if (!commitData || !Array.isArray(commitData)) return res.status(400).json({ error: "commitData array required" });

        const engine = new EvolutionEngine();
        const report = await engine.analyze(commitData);
        res.json(report);
    } catch (e) {
        console.error("Evolution analysis error:", e);
        res.status(500).json({ error: "Failed to perform evolution analysis" });
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      const { fileNames } = req.body;
      if (!Array.isArray(fileNames)) return res.status(400).json({ error: "fileNames array required" });
      
      const prompt = `Act as an expert software architect. Analyze these project files: ${fileNames.join(', ')}.
      Provide a deep technical analysis covering:
      1. Code smells detected.
      2. Estimation of cyclomatic complexity (high/medium/low).
      3. Dependency issues.
      4. Scalability/Maintainability risks and bottlenecks.
      5. Specific architectural improvements.

      Return the response strictly as a JSON object with the following structure:
      {
        "summary": "Professional markdown summary...",
        "analysis": {
          "codeSmells": ["smell1", "smell2"],
          "cyclomaticComplexity": "high/medium/low",
          "dependencyIssues": ["issue1", "issue2"],
          "scalabilityRisks": ["risk1", "risk2"]
        }
      }
      Do not include any other markdown formatting or text outside the JSON structure.`;
      
      const result = await getAI().models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
      });
      
      const text = result.text?.trim() || "{}";
      const cleanedText = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      const jsonResponse = JSON.parse(cleanedText);
      res.json(jsonResponse);
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
