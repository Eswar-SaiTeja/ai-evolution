# AI EVOLUTION

> "Never Build Just One AI. Build What Comes Next."

AI EVOLUTION is a premium, unified cross-platform AI workspace that orchestrates five core AI modes—J.A.R.V.I.S., ULTRON, F.R.I.D.A.Y., K.A.R.E.N., and E.D.I.T.H.—into a production-grade scinf-fi glass HUD cockpit.

---

## 1. System Architecture

```
                                  [ REACT CLIENT SPA ]
                                          │
                   (HTTPS Streams / SSE)  │  (Global Palette / PWA)
                                          ▼
                               [ EXPRESS GATEWAY API ]
                                          │
         ┌───────────────┬────────────────┼───────────────┬───────────────┐
         ▼               ▼                ▼               ▼               ▼
    [J.A.R.V.I.S.]   [ULTRON]        [F.R.I.D.A.Y.]   [K.A.R.E.N.]   [E.D.I.T.H.]
     Assistant        Agents          Automations       Mentorship     Dashboard
         │               │                │               │               │
         └───────────────┴────────────────┼───────────────┴───────────────┘
                                          ▼
                                  [ AI ORCHESTRATOR ]
                                          │
                          ┌───────────────┴───────────────┐
                          ▼                               ▼
               [ Live Retrieval Engine ]         [ RAG Vector Search ]
               - Classification                  - Pure JS Dense Embeddings
               - DDG Scraper                     - Cosine Similarity Matching
               - Extraction & Citation           - SQLite Document Storage
```

---

## 2. Core Modules

1. **J.A.R.V.I.S. (The Assistant)**: Chat window with real-time text streaming, citations, file attachments, and browser-native Text-To-Speech (TTS) voice responses.
2. **ULTRON (The Reasoning Engine)**: Multi-step planning timeline showing states (Plan -> Search -> Analyze -> Compare -> Verify -> Generate -> Final Result) with execution time stats.
3. **F.R.I.D.A.Y. (The Automation Successor)**: Trigger-action workflow pipeline creator supporting Slack and Email dispatch configurations.
4. **K.A.R.E.N. (The Mentor)**: Adaptive roadmap builder generating step-by-step lecture items, code exercises, and quizzes.
5. **E.D.I.T.H. (The Command Legacy)**: System alerts panel flagging out-of-date libraries or un-indexed RAG items, displaying weekly token graphs.

---

## 3. Quick Start & Setup

### Requirements
- **Node.js**: `v18+` or `v24+`
- **NPM**: `v10+`

### Installation
1. Clone the repository and navigate into the root directory.
2. Run installation of workspace nodes:
   ```bash
   npm install
   ```

3. Sync database models using SQLite & Prisma:
   ```bash
   npm run prisma:migrate
   ```

### Configuration
Configure models or endpoints by checking `.env`:
```ini
PORT=5000
JWT_SECRET=ai-evolution-super-secret-key-2026

# Add provider keys if available (falls back to simulation modes if empty)
GEMINI_API_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

### Run Development Servers
Start both the React client (`http://localhost:5173`) and Express backend (`http://localhost:5000`) concurrently:
```bash
npm run dev
```

---

## 4. Keyboard Shortcuts
- `Ctrl + K` (or `Cmd + K` on macOS): Global Search Command Palette.
- `Ctrl + N`: Spawn new conversation thread.
- `Esc`: Close open modal overlays.
