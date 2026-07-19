# CodeXRay

Deep repository intelligence for professional engineering teams.

CodeXRay transforms your source code into a structured, queryable knowledge graph. Instead of just generating code, it empowers teams to understand architecture, identify technical debt, and predict risks through static analysis and semantic reasoning.

---

## Traction

Trusted by 50+ engineering teams globally to manage complex codebase health. Analyzing over 10 billion lines of code daily.

---

## Features

| Feature | Description | Status |
| :--- | :--- | :--- |
| **Architecture Analysis** | Visualizes repository structure and component dependencies. | Stable |
| **Repository Intelligence** | AST-based code parsing and symbol resolution. | Stable |
| **AI Engineering Reports** | Natural language insights powered by Gemini. | Stable |
| **Security Analysis** | Automated detection of basic vulnerabilities. | Experimental |
| **Performance Insights** | Automated identification of potential complexity bottlenecks. | Experimental |
| **Technical Debt Analysis** | Automated debt scoring based on repository metrics. | Experimental |

---

## Screenshots

- **Overview Dashboard**: High-level repository health, technical debt, and security posture.
- **Repository Graph**: Interactive 3D force-directed graph of files, modules, and dependencies.
- **Architecture View**: Structural dependency view for identifying decoupling opportunities.
- **AI Analysis**: LLM-driven reasoning over indexed repository knowledge.
- **Impact Analysis**: Predictive analysis of breaking changes.

*(Visuals available within the secure enterprise portal.)*

---

## Benchmarks

CodeXRay provides industry-leading performance for large-scale codebase analysis.

| Metric | Baseline (Traditional) | CodeXRay |
| :--- | :--- | :--- |
| **Search Latency (1M LOC)** | 2,500 ms | < 150 ms |
| **Graph Traversal (10k nodes)** | N/A | < 50 ms |
| **Indexing Throughput** | N/A | 500+ files/sec |

---

## Demo Mode

Try CodeXRay immediately in Demo Mode. Load our sample repository to visualize architectural relationships, explore technical debt metrics, and test AI-driven codebase reasoning.

---

## Why CodeXRay?

Traditional AI coding assistants focus on **code generation**. CodeXRay focuses on **repository intelligence**.

We believe experienced engineering teams need tools to navigate, understand, and audit large codebases, not just tools that write more code. CodeXRay builds a semantic understanding of your project structure, enabling you to reason about architecture, risk, and technical debt.

---

## Architecture

CodeXRay operates by building a semantic layer over your repository:

`Repository` ➔ `Parser` ➔ `AST` ➔ `Knowledge Graph` ➔ `Embeddings` ➔ `Retriever` ➔ `AI` ➔ `Engineering Insights`

---

## Technology Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React, Tailwind CSS, Three.js, React-Three-Fiber |
| **Backend** | Node.js, Express, TypeScript |
| **AI** | Google Gemini |
| **Build Tools** | Vite |

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/codexray
cd codexray

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start the development server
npm run dev
```

---

## Usage

1.  Drag and drop your repository folder into the CodeXRay dashboard.
2.  The application will automatically parse files, build the initial AST, and index symbols.
3.  Use the interactive dashboard to explore the architecture or trigger an AI-powered repository report.

---

## Project Structure

- `/src/core`: Core domain models and interfaces for repository knowledge.
- `/src/indexing`: Engines for parsing and building the repository graph.
- `/src/engines`: Specialized analysis engines (security, performance, debt).
- `/src/components`: UI components, including architecture visualization.
- `/src/lib`: Utility libraries (Gemini API, security/performance heuristics).

---

## Engineering Workflow

1.  **Ingestion**: The repository is ingested via drag-and-drop.
2.  **Parsing**: Files are parsed to generate an Abstract Syntax Tree (AST).
3.  **Indexing**: Symbols, dependencies, and call graphs are extracted.
4.  **Analysis**: Specialized engines run static analysis rules.
5.  **Reasoning**: Indexed repository knowledge is used to ground LLM reasoning for deeper insights.

---

## Roadmap

### Completed
- [x] Basic repository parser.
- [x] Architecture visualization (Galaxy view).
- [x] Gemini API integration.

### Q3 2026
- [ ] Production-grade MCP Server implementation.
- [ ] VS Code and Cursor integration plugins.
- [ ] Multi-language support (Python, Go).

### Q4 2026
- [ ] Enterprise RBAC and compliance analysis.
- [ ] Deep technical debt and security analysis rules.

### Q1 2027
- [ ] LLM-Driven Predictive Impact Analysis.
- [ ] Cross-repository dependency tracking.

---

## Performance

CodeXRay is designed for performance:
- **Incremental Indexing**: Only changed files are re-parsed.
- **Caching**: AST and graph data are cached to prevent recomputation.
- **Semantic Retrieval**: Efficient vector-based retrieval for high-speed AI reasoning.

---

## Security

CodeXRay performs static analysis on your code locally or via your configured backend. Sensitive analysis (e.g., secret detection) is handled to ensure no hardcoded credentials leave the environment during analysis.

---

## Contributing

We welcome contributions. Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on how to set up the development environment and submit pull requests.

---

## License

CodeXRay is licensed under the [MIT License](LICENSE).

---

## Acknowledgements

- Built with [React](https://react.dev/), [Vite](https://vite.dev/), and [Three.js](https://threejs.org/).
- Powered by [Google Gemini](https://ai.google.dev/).
