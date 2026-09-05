# UPSC Personal Research Assistant — Project Blueprint

> **Agentic Coding: ENABLED**
> This file is designed to be used with an agentic AI coding assistant (e.g. Amazon Q `/dev` mode).
> Feed each phase section as a prompt to scaffold, implement, and test incrementally.
> Example usage: _"Implement Phase 1 from PROJECT_BLUEPRINT.md"_

---

## Overview

A hyper-personalized, agentic AI research assistant with RAG support, quiz generation,
mains evaluation, mistake analytics, and strategy planning. Supports both shared global
resources and personal user vaults. Built for UPSC CSE preparation but extensible to any exam.

---

## Project Structure

```
research-assistant/
├── backend/
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── ingestion_agent.py
│   │   ├── research_agent.py
│   │   ├── quiz_agent.py
│   │   ├── evaluator_agent.py
│   │   ├── analytics_agent.py
│   │   └── strategy_agent.py
│   ├── rag/
│   │   ├── __init__.py
│   │   ├── loader.py
│   │   ├── chunker.py
│   │   ├── embedder.py
│   │   ├── retriever.py
│   │   └── watcher.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── middleware.py
│   │   └── routes/
│   │       ├── chat.py
│   │       ├── quiz.py
│   │       ├── mains.py
│   │       ├── analytics.py
│   │       ├── upload.py
│   │       └── strategy.py
│   ├── models/
│   │   ├── user.py
│   │   ├── quiz.py
│   │   ├── mains.py
│   │   └── analytics.py
│   ├── db/
│   │   ├── database.py
│   │   └── migrations/
│   ├── config/
│   │   └── settings.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Chat/
│       │   ├── Quiz/
│       │   ├── Mains/
│       │   ├── Analytics/
│       │   ├── Repository/
│       │   └── Strategy/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Chat.tsx
│       │   ├── Quiz.tsx
│       │   ├── MainsLab.tsx
│       │   ├── Repository.tsx
│       │   ├── Analytics.tsx
│       │   └── Strategy.tsx
│       ├── hooks/
│       ├── store/
│       ├── api/
│       └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
│
├── repository/
│   ├── global/
│   │   ├── ncert/
│   │   ├── pyqs/
│   │   ├── standard_books/
│   │   └── current_affairs/
│   └── users/
│       └── {user_id}/
│           ├── notes/
│           ├── uploads/
│           └── bookmarks/
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Tech Stack

| Layer           | Technology                            |
|-----------------|---------------------------------------|
| LLM             | OpenAI GPT-4o / Gemini 1.5 / Ollama  |
| Embeddings      | text-embedding-3-small / nomic-embed  |
| Vector DB       | ChromaDB (local) / Weaviate (cloud)   |
| Agent Framework | LangGraph + LangChain                 |
| Backend         | FastAPI (Python 3.11+)                |
| Database        | PostgreSQL + SQLAlchemy               |
| Auth            | Supabase Auth / JWT                   |
| Frontend        | React 18 + TypeScript + TailwindCSS   |
| Folder Watching | Python watchdog                       |
| Visualization   | Recharts + D3.js                      |
| Deployment      | Docker + AWS ECS / Railway            |
| Storage         | Local filesystem / AWS S3             |

---

## Phase 1 — RAG Pipeline + Folder Ingestion + Chat (Week 1–2)

### Goals
- Set up folder watcher for auto-ingestion
- Build chunking + embedding pipeline
- Scoped retriever (global + per-user namespaces)
- Basic chat API with citations

### Files to Build

#### `backend/rag/watcher.py`
```python
# Watches repository/ folder for new files
# On new file: trigger loader → chunker → embedder
# Uses: watchdog library
# Key class: RepositoryWatcher(Observer)
```

#### `backend/rag/loader.py`
```python
# Supports: PDF, DOCX, TXT, MD, web URLs
# Uses: LangChain document loaders
# Attaches metadata: {source, user_id, topic, subtopic, year, gs_paper}
# Key function: load_document(path, metadata) -> List[Document]
```

#### `backend/rag/chunker.py`
```python
# Semantic chunking per topic
# Chunk size: 512 tokens, overlap: 50
# Key function: chunk_documents(docs) -> List[Document]
```

#### `backend/rag/embedder.py`
```python
# Embeds chunks into ChromaDB
# Namespaces: "global_{collection}" or "user_{user_id}_{collection}"
# Key function: embed_and_store(chunks, namespace)
```

#### `backend/rag/retriever.py`
```python
# Scoped retriever — takes list of active namespaces from user session
# Key function: get_retriever(user_id, active_sources: List[str]) -> BaseRetriever
```

#### `backend/agents/research_agent.py`
```python
# RAG-grounded Q&A agent
# Returns answer + source citations
# Uses: LangGraph node, scoped retriever
```

#### `backend/api/routes/chat.py`
```python
# POST /chat — accepts {query, user_id, active_sources[]}
# Streams response via SSE
# Returns: {answer, citations, sources_used}
```

### Dependencies (`requirements.txt`)
```
langchain>=0.2.0
langchain-openai
langchain-community
langgraph>=0.1.0
chromadb>=0.5.0
watchdog>=4.0.0
fastapi>=0.111.0
uvicorn
sqlalchemy>=2.0
psycopg2-binary
python-jose[cryptography]
python-multipart
pypdf
python-docx
pydantic-settings
```

---

## Phase 2 — Quiz Engine + Prelims Assessment (Week 3–4)

### Goals
- MCQ generation from any topic/document
- Adaptive difficulty per user history
- UPSC-style negative marking simulation
- Post-quiz topic-wise analysis

### Files to Build

#### `backend/agents/quiz_agent.py`
```python
# Generates MCQs using RAG context + LLM
# Input: {topic, difficulty, num_questions, source_scope, user_id}
# Output: List[Question] with options, answer, explanation, source_chunk
# Difficulty adapts based on user's past performance on that topic
# Prompt template: UPSC style, 4 options, single correct, JSON output
```

#### `backend/models/quiz.py`
```python
# SQLAlchemy models:
# Question: id, topic, subtopic, gs_paper, difficulty, question_text,
#           options (JSON), correct_answer, explanation, source_ref, created_at
# QuizSession: id, user_id, questions (JSON), score, time_taken,
#              topic_breakdown (JSON), created_at
# QuizAttempt: id, session_id, question_id, user_answer,
#              is_correct, time_spent
```

#### `backend/api/routes/quiz.py`
```python
# POST /quiz/generate  → {topic, num_q, difficulty, sources[]}
# POST /quiz/submit    → {session_id, answers[]}
# GET  /quiz/history   → paginated quiz history
# GET  /quiz/analysis/{session_id} → topic-wise breakdown
```

### Quiz Generation Prompt Template
```
You are a UPSC Prelims question setter.
Generate {num_questions} MCQs on: {topic}
Difficulty: {difficulty}
Context from documents: {retrieved_context}

Rules:
- 4 options (A/B/C/D), single correct answer
- No ambiguous questions
- Include a 2-line explanation referencing the source
- Tag each question with: gs_paper, subtopic

Output as JSON array.
```

---

## Phase 3 — Mains Evaluator + Mistake Analytics (Week 5–6)

### Goals
- AI evaluation of mains answers on UPSC rubric
- Per-user mistake database with spaced repetition
- Weak area heatmap
- Gap detection in personal vault

### Files to Build

#### `backend/agents/evaluator_agent.py`
```python
# Evaluates mains answers
# Input: {question, user_answer, marks (7/10/15/20), user_id}
# Retrieves model answer context via RAG
# Scores on: introduction, structure, content_coverage,
#            examples_used, conclusion, word_limit
# Output: {total_score, breakdown, feedback, model_answer_ref}
```

#### `backend/agents/analytics_agent.py`
```python
# Runs after every quiz/mains submission
# Updates user profile: weak_topics, strong_topics
# Implements SM-2 spaced repetition algorithm
# Detects gaps: topics in syllabus with no user material
# Output: updated profile + revision_schedule
```

#### `backend/models/analytics.py`
```python
# MistakeLog: id, user_id, question_id, topic, subtopic,
#             mistake_type, timestamp, review_due_date
# UserProfile: id, user_id, weak_topics (JSON), strong_topics (JSON),
#              exam_date, optional_subject, daily_hours,
#              learning_style, last_updated
# GapReport: id, user_id, missing_topics (JSON), generated_at
```

#### `backend/api/routes/analytics.py`
```python
# GET  /analytics/heatmap      → topic weakness heatmap data
# GET  /analytics/gaps         → missing topics vs syllabus
# GET  /analytics/revision     → due revisions today (spaced repetition)
# GET  /analytics/progress     → score trend over time
```

### Mains Evaluation Rubric Prompt
```
You are a UPSC Mains examiner.
Question: {question} [{marks} marks]
Candidate Answer: {user_answer}
Reference Material: {rag_context}

Evaluate on:
1. Introduction (relevance, hook)
2. Body (structure, headings, flow)
3. Content (accuracy, coverage, examples)
4. Conclusion (forward-looking, crisp)
5. Word limit adherence

Return JSON: {score, max_score, breakdown{}, feedback[], model_points[]}
```

---

## Phase 4 — Strategy Agent + Visual Aids + Full Web UI (Week 7–8)

### Goals
- AI-generated personalized study plan
- Mind maps, timelines, comparison tables
- Complete React frontend
- Docker deployment

### Files to Build

#### `backend/agents/strategy_agent.py`
```python
# Input: user profile + analytics + exam_date
# Calculates days remaining, urgency per topic
# Generates: daily_plan[], weekly_milestones[], resource_suggestions[]
# Considers: weak areas, revision dues, daily_hours available
```

#### Frontend Pages

**`frontend/src/pages/Dashboard.tsx`**
```
- Weak area heatmap (Recharts)
- Today's revision queue
- Study streak
- Exam countdown
- Quick access: Chat / Quiz / Mains
```

**`frontend/src/pages/Chat.tsx`**
```
- Source selector (checkboxes: global packs + personal vault)
- Chat interface with streaming responses
- Citation cards below each response
- Save to notes button
```

**`frontend/src/pages/Quiz.tsx`**
```
- Topic selector + difficulty + source scope
- Timer + negative marking toggle
- Post-quiz: topic breakdown, wrong answer explanations
- "Add to revision" button per wrong answer
```

**`frontend/src/pages/MainsLab.tsx`**
```
- Question input + marks selector
- Answer textarea with word counter
- AI evaluation panel: score breakdown + feedback
- History of past answers with improvement trend
```

**`frontend/src/pages/Repository.tsx`**
```
- Global packs browser (subscribe/unsubscribe)
- Personal vault: upload, tag, organize
- Active sources toggle (per-session selection)
- Gap alerts: "You have no material on X topic"
```

**`frontend/src/pages/Strategy.tsx`**
```
- AI-generated weekly study plan
- Mind map viewer (D3.js)
- Current affairs timeline
- Comparison tables (Acts, Schemes, Articles)
```

---

## Data Models (PostgreSQL)

```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    exam_target TEXT,
    optional_subject TEXT,
    exam_date DATE,
    daily_hours INTEGER DEFAULT 4,
    learning_style TEXT DEFAULT 'balanced',
    created_at TIMESTAMP DEFAULT NOW()
);

-- User Source Preferences
CREATE TABLE user_source_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    source_name TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Quiz Sessions
CREATE TABLE quiz_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    topic TEXT,
    score FLOAT,
    total_questions INTEGER,
    time_taken INTEGER,
    topic_breakdown JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mistake Log
CREATE TABLE mistake_log (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    question_text TEXT,
    topic TEXT,
    subtopic TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    review_due_date DATE,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Mains Submissions
CREATE TABLE mains_submissions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    question TEXT,
    user_answer TEXT,
    marks INTEGER,
    score FLOAT,
    breakdown JSONB,
    feedback JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ChromaDB Namespace Strategy

```python
# Global collections (shared, read-only for users)
GLOBAL_COLLECTIONS = [
    "global_ncert",
    "global_pyqs",
    "global_standard_books",
    "global_current_affairs"
]

# Per-user collections (private)
def user_collection(user_id: str, type: str) -> str:
    return f"user_{user_id}_{type}"
# e.g. "user_abc123_notes", "user_abc123_uploads"

# Scoped retriever builds from user's active_sources selection
def build_retriever(user_id: str, active_sources: list[str]):
    collections = []
    for source in active_sources:
        if source.startswith("global_"):
            collections.append(source)
        else:
            collections.append(user_collection(user_id, source))
    return MultiCollectionRetriever(collections)
```

---

## Hyper-Personalization Layer

### Three-Tier Data Access Model

| Tier            | Source                                      | Who Controls        |
|-----------------|---------------------------------------------|---------------------|
| Global Commons  | NCERT, PYQs, Standard references            | Admin               |
| Curated Packs   | Topic-wise bundles (e.g. "Polity Pack")     | Admin, user subscribes |
| Personal Vault  | User's own uploads, notes, highlights       | User only           |

### Personal Learning Profile (`profile.json`)
```json
{
  "exam_target": "UPSC CSE 2026",
  "optional_subject": "Geography",
  "weak_topics": ["Economy - Monetary Policy", "Environment - Conventions"],
  "strong_topics": ["Polity", "History - Modern"],
  "daily_study_hours": 4,
  "preferred_language": "English",
  "learning_style": "visual",
  "revision_schedule": "spaced_repetition"
}
```

### Personalization Behaviors
- Per-query source scoping via checkbox UI
- Adaptive quiz difficulty weighted by weak areas
- Mains feedback evolves with writing history
- Gap detection: syllabus topics with no user material
- SM-2 spaced repetition for mistake review scheduling
- Strategy agent adjusts plan daily based on analytics output

---

## API Endpoints Summary

```
Auth
  POST   /auth/register
  POST   /auth/login
  GET    /auth/me

Chat
  POST   /chat                      # {query, active_sources[]}

Quiz
  POST   /quiz/generate             # {topic, num_q, difficulty, sources[]}
  POST   /quiz/submit               # {session_id, answers[]}
  GET    /quiz/history
  GET    /quiz/analysis/{id}

Mains
  POST   /mains/evaluate            # {question, answer, marks}
  GET    /mains/history

Analytics
  GET    /analytics/heatmap
  GET    /analytics/gaps
  GET    /analytics/revision
  GET    /analytics/progress

Repository
  POST   /repository/upload         # multipart file upload
  GET    /repository/global         # list global packs
  PUT    /repository/sources        # update active source selection
  DELETE /repository/{file_id}

Strategy
  GET    /strategy/plan             # AI study plan
  GET    /strategy/mindmap/{topic}
  GET    /strategy/timeline         # current affairs timeline
```

---

## Environment Variables (`.env.example`)

```env
# LLM
OPENAI_API_KEY=your_key_here
LLM_MODEL=gpt-4o
EMBEDDING_MODEL=text-embedding-3-small

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/research_assistant

# ChromaDB
CHROMA_PERSIST_DIR=./chroma_db

# Auth
JWT_SECRET=your_jwt_secret
JWT_EXPIRE_MINUTES=1440

# Storage
REPOSITORY_BASE_PATH=./repository
USE_S3=false
AWS_BUCKET_NAME=your_bucket

# App
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000
```

---

## Docker Compose

```yaml
version: "3.9"
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./repository:/app/repository
      - ./chroma_db:/app/chroma_db
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:8000

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: research_assistant
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## Build Order (Recommended)

1. `backend/config/settings.py` — env config
2. `backend/db/database.py` — DB connection + models
3. `backend/rag/` — full RAG pipeline (loader → chunker → embedder → retriever → watcher)
4. `backend/agents/research_agent.py` — first agent
5. `backend/api/main.py` + `routes/chat.py` — working chat endpoint
6. `backend/agents/quiz_agent.py` + `routes/quiz.py`
7. `backend/agents/evaluator_agent.py` + `routes/mains.py`
8. `backend/agents/analytics_agent.py` + `routes/analytics.py`
9. `backend/agents/strategy_agent.py` + `routes/strategy.py`
10. `frontend/` — React app, page by page
11. `docker-compose.yml` — containerize everything

---

## Agentic Coding Instructions

This blueprint is structured for use with an agentic AI coding assistant with file read/write access.

### How to Use
- Say: _"Implement Phase 1 from PROJECT_BLUEPRINT.md"_
- Say: _"Scaffold the full project structure from PROJECT_BLUEPRINT.md"_
- Say: _"Build the quiz agent as described in Phase 2"_
- Say: _"Create all database models from the Data Models section"_

### Agent Capabilities Expected
- Read this file and extract requirements per phase
- Create all files and folders in the project structure
- Write working, minimal Python and TypeScript code
- Install dependencies and run validation commands
- Test each phase before moving to the next

### Key Design Decisions for Agent
- ChromaDB namespacing isolates user data completely — never mix namespaces
- LangGraph manages stateful multi-agent workflows — use nodes + edges pattern
- Folder watcher enables zero-friction document ingestion — always attach metadata
- SM-2 algorithm for spaced repetition — same as Anki, implement faithfully
- Scoped retriever built dynamically per query from user's active source selection
- All agent outputs must be JSON-structured for frontend consumption
- Use SSE (Server-Sent Events) for streaming chat responses
- Every API route must validate JWT and extract user_id from token

---

## Phase 5 — Production Readiness & Enterprise Hardening Roadmap

### Overview
This phase provides the exact architectural requirements and task checklist required to transition the UPSC Personal Research Assistant from a local development setup into a production-grade, highly available, secure, and scalable cloud application.

---

### 1. Security & Access Control Hardening

- [ ] **Strict JWT Middleware & Session Revocation**:
  - Enforce token signature verification on all FastAPI endpoints.
  - Implement Redis-backed token revocation blacklist for logout and credential rotation.
- [ ] **Rate Limiting & Anti-DDoS**:
  - Integrate `slowapi` or Redis-backed sliding window rate limiter on API endpoints (e.g. 10 chat requests/min, 5 quiz generations/min per user).
- [ ] **Prompt Injection Defense & Guardrails**:
  - Add input sanitization and NeMo Guardrails / Guardrails AI to sanitize user inputs before forwarding to LLM models.
  - Enforce schema validation on model outputs to prevent hallucinated payload structures.
- [ ] **CORS & Security Headers**:
  - Restrict CORS origins strictly to trusted production domain origins.
  - Add security headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`).
- [ ] **Secret Management**:
  - Migrate plain `.env` files to AWS Secrets Manager, HashiCorp Vault, or GCP Secret Manager.

---

### 2. Database & Vector Search Scalability

- [ ] **Database Migrations (Alembic)**:
  - Initialize Alembic versioning for SQLAlchemy database schema migrations (`alembic init alembic`).
  - Generate automated migration scripts for versioned deployment updates.
- [ ] **Asynchronous Ingestion Worker Queue**:
  - Replace synchronous document parsing with an asynchronous queue (Celery + Redis or ARQ).
  - Offload PDF/DOCX text extraction, chunking, and embedding generation to background worker processes.
- [ ] **Vector Database Enterprise Scaling**:
  - Provide multi-tenant configuration for production vector database clusters (Qdrant, Weaviate Cloud, or PostgreSQL + `pgvector`).
  - Implement vector collection index optimization (HNSW indexing with cosine metric).
- [ ] **Caching Layer (Redis)**:
  - Cache frequent RAG vector query embeddings and static syllabus metadata in Redis to reduce embedding latency and LLM costs.

---

### 3. Observability, Telemetry & RAG Evaluation

- [ ] **Multi-Agent & RAG Tracing (LangSmith / Phoenix)**:
  - Integrate LangSmith or Arize Phoenix instrumentation to record agent execution graphs, prompt inputs, tool calls, and retrieval contexts.
- [ ] **Structured Logging & Correlation IDs**:
  - Implement structured JSON logging (`structlog` or `loguru`) attaching `request_id`, `user_id`, and execution timestamps to every log line.
- [ ] **Application Metrics (Prometheus & Grafana)**:
  - Expose `/metrics` endpoint using `prometheus-fastapi-instrumentator`.
  - Monitor P95/P99 latency, token usage, active vector searches, HTTP status codes, and CPU/memory footprint.
- [ ] **Continuous RAG Quality Benchmark (RAGAS)**:
  - Set up automated RAGAS (RAG Assessment) evaluation pipeline checking context precision, context recall, faithfulness, and answer relevance on a golden test dataset.

---

### 4. Reliability, Resilience & CI/CD Pipeline

- [ ] **LLM Provider Circuit Breaker & Failover**:
  - Implement automatic fallback strategy: Primary local Ollama / Cloud GPT-4o → Fallback Claude / Gemini model upon timeout or HTTP 5xx errors.
  - Wrap model calls with retry logic using `tenacity` library (exponential backoff).
- [ ] **Automated Test Suite**:
  - **Backend**: Pytest suite for API endpoints, RAG loaders, chunkers, and agent workflow nodes.
  - **Frontend**: Vitest / React Testing Library for components and Playwright for end-to-end user flows.
- [ ] **CI/CD Pipeline (GitHub Actions)**:
  - Pipeline steps: Linting (`ruff`, `eslint`), Type checking (`mypy`, `tsc`), Security audit (`trivy`), Unit tests, and Docker image build & push to ECR/GHCR.

---

### 5. Production Infrastructure & Deployment

- [ ] **Multi-Stage Container Optimization**:
  - Optimize `backend/Dockerfile` and frontend build files using multi-stage builds to minimize image sizes (<200MB).
- [ ] **Infrastructure as Code (Terraform)**:
  - Define infrastructure using Terraform modules for AWS ECS Fargate / EKS, RDS PostgreSQL, ElastiCache Redis, and S3 document storage.
- [ ] **Reverse Proxy & TLS Termination**:
  - Deploy Nginx / Traefik ingress controller with automatic TLS certificate provisioning via Let's Encrypt / Certbot.

