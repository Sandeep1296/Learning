# UPSC Personal Research Assistant — Local Run Instructions

This guide provides step-by-step instructions to set up, configure, and run the **UPSC Personal Research Assistant** locally on your machine with Python FastAPI, local ChromaDB vector store, Ollama, and Next.js.

---

## 📋 System Prerequisites

Ensure you have the following installed on your system:
- **Python**: 3.11+ (`python3 --version`)
- **Node.js**: 18.0+ & `npm` (`node --version`)
- **Ollama**: (For offline local LLM execution) [Download Ollama](https://ollama.com)
- **Git**

---

## 🛠️ Step 1: Environment Configuration

Copy the sample environment file to create your local `.env` configuration:

```bash
cp .env.example .env
cp .env.example .env.local
```

### Key `.env` Settings:
```env
# Local LLM Execution via Ollama
USE_OLLAMA=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional Cloud API Fallbacks
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
OPENAI_API_KEY=your_openai_api_key_here

# Local Storage Paths
DATABASE_URL=sqlite:///./research_assistant.db
CHROMA_PERSIST_DIR=./chroma_db
REPOSITORY_BASE_PATH=./repository
```

---

## 🐍 Step 2: Set Up Python Backend Environment

1. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   ```

2. Activate the virtual environment:
   - **macOS / Linux**:
     ```bash
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```

3. Install backend dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r backend/requirements.txt
   ```

---

## 🦙 Step 3: Start Local Ollama Server & Pull Model

1. Start the Ollama local daemon in a separate terminal:
   ```bash
   ollama serve
   ```

2. Pull the recommended local model (`llama3.2`):
   ```bash
   ollama pull llama3.2
   ```

---

## 🚀 Step 4: Run the Python Agentic AI Backend Server

With your virtual environment active (`source venv/bin/activate`), run:

```bash
python -m backend.api.main
```

Or using Uvicorn directly:
```bash
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

### Verification:
- **Backend Health Check**: Open `http://localhost:8000/health`
- **Interactive Swagger API Docs**: Open `http://localhost:8000/docs`

---

## 💻 Step 5: Run the Next.js Frontend

In a new terminal window:

1. Install frontend npm dependencies:
   ```bash
   npm install
   ```

2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 📚 Step 6: Test Auto Document Ingestion (Local RAG)

The backend automatically monitors the `./repository` folder via a background Python `watchdog` process.

1. Drop any PDF, DOCX, TXT, or MD study notes into:
   - `./repository/global/ncert/` (Global reference)
   - `./repository/users/default_user/notes/` (Personal vault)
2. Watch the backend terminal output:
   ```
   [Watcher] Detected file change: repository/global/ncert/polity_chapter1.pdf
   [Loader] Loaded document polity_chapter1.pdf
   [Chunker] Split 1 document(s) into 12 chunk(s).
   [Embedder] Embedded 12 chunk(s) into Chroma collection: global_ncert
   ```
3. Ask questions in the AI Chat UI at `http://localhost:3000/ai-chat` — responses will automatically retrieve and cite your uploaded documents!

---

## 🐳 Alternative: Run Everything with Docker Compose

If you have Docker installed, you can start the entire stack (FastAPI Backend, Next.js Frontend, PostgreSQL, ChromaDB) with a single command:

```bash
docker-compose up --build
```

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
