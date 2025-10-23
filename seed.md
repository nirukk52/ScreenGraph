# Steering Wheel - Documentation System Evaluation

**Project**: ScreenGraph SAAS - "A living map of your mobile app for UI/UX and competitive analysis"

**Purpose**: Create a centralized documentation system for business memory, rules, facts, procedures, preferences, coding standards, founder reports, WIP, and tasks. Must be AI-agent readable and chat-enabled for real-time updates.

---

## Requirements Analysis

### Core Requirements
1. **AI-Agent Readable**: Plain markdown/structured format that Leap, Cursor, Claude can parse
2. **Chat Interface**: Ability to converse with docs and modify on-the-fly
3. **Version Control**: Track changes over time
4. **Mandatory Reading**: Force AI agents to read specific sections
5. **Simple Setup**: Solo dev, minimal complexity
6. **Categories**: Rules, facts, procedures, preferences, coding standards, reports, WIP, tasks

---

## Option 1: Docusaurus 3.9

### Overview
Meta's static site generator built on React, widely used for technical documentation.

### Pros
- ✅ Rich MDX support (Markdown + React components)
- ✅ Built-in versioning system
- ✅ Search functionality out of box
- ✅ Plugin ecosystem (changelog, blog, docs)
- ✅ Mature, well-documented

### Cons
- ❌ **Over-engineered** for solo dev needs
- ❌ Requires separate build/deployment process
- ❌ Heavy frontend bundle (~300KB+)
- ❌ No native chat interface - would need custom integration
- ❌ Slower iteration cycle (build → deploy)
- ❌ Complex folder structure (docs/, blog/, src/, etc.)
- ❌ Not designed for real-time editing

### AI-Agent Integration
- Agents can read markdown files directly from `/docs` folder
- Would need custom API to expose docs to chat interface
- Versioning through Git + Docusaurus versioning

### Effort Estimate: **High** (2-3 days setup + ongoing maintenance)

---

## Option 2: Starlight (Astro Framework)

### Overview
Astro's documentation theme - modern, fast, content-focused.

### Pros
- ✅ Excellent performance (partial hydration)
- ✅ Clean MDX support
- ✅ Simple file-based routing
- ✅ Built-in sidebar navigation
- ✅ TypeScript-first
- ✅ Lighter than Docusaurus

### Cons
- ❌ Still requires build process
- ❌ No native versioning system
- ❌ No chat interface built-in
- ❌ Younger ecosystem than Docusaurus
- ❌ Separate deployment needed
- ❌ Static site - not designed for real-time updates

### AI-Agent Integration
- Agents read from markdown files in `/src/content/docs`
- Would need custom backend for chat + editing
- Manual versioning via Git

### Effort Estimate: **Medium** (1-2 days setup + custom features)

---

## Option 3: Notion

### Overview
All-in-one workspace with docs, wikis, databases, and collaboration features. Popular among startups and solo devs.

### Pros
- ✅ **Zero setup** - create account and start writing
- ✅ **Rich editor** - blocks, databases, embeds, formatting
- ✅ **Built-in AI** - Notion AI for chat, summarization, editing
- ✅ **Version history** - track changes over time (paid plans)
- ✅ **Templates** - ready-made structures for wikis, docs, project management
- ✅ **Mobile apps** - access from anywhere
- ✅ **Search** - powerful full-text search
- ✅ **Databases** - tables, boards, calendars for tasks/reports
- ✅ **Collaboration** - comments, mentions (if team grows)

### Cons
- ❌ **Not AI-agent readable** - proprietary format, no direct file access
- ❌ **API limitations** - rate limits, complex setup for programmatic access
- ❌ **Export friction** - markdown export exists but loses structure
- ❌ **Context switching** - separate tool outside codebase
- ❌ **Vendor lock-in** - data trapped in Notion ecosystem
- ❌ **No mandatory reading enforcement** - can't force AI agents to read specific pages
- ❌ **Cost** - free tier limited, paid plans $8-10/month
- ❌ **Performance** - can be slow with large workspaces
- ❌ **Offline limitations** - requires internet connection
- ❌ **No Git integration** - can't version control with code

### AI-Agent Integration
**Major limitation:**
- Notion API exists but is paginated, slow, and complex
- AI agents like Leap/Cursor can't directly read Notion pages without custom integration
- Would need to build Notion API wrapper → convert to markdown → feed to AI
- No way to enforce "mandatory reading" for AI agents
- Updates require API calls instead of direct file edits

**Workaround approach:**
1. Export Notion pages to markdown manually
2. Commit to Git repository
3. AI reads exported files
4. Manual sync process between Notion ↔ Git

This defeats the purpose of real-time collaboration with AI.

### Effort Estimate: **Low for setup, High for AI integration** (5 min setup, 1-2 days for proper AI integration)

---

## Option 4: Custom Encore.ts + React Solution

### Overview
Build a lightweight docs app within the ScreenGraph project using Encore.ts backend + React frontend with markdown rendering.

### Architecture
```
backend/
  steering/
    encore.service.ts
    get_doc.ts           # Fetch single doc
    list_docs.ts         # List all docs  
    update_doc.ts        # Update doc content
    chat_with_docs.ts    # AI chat endpoint
    versions/
      list_versions.ts   # Version history
      get_version.ts     # Get specific version
  db/
    index.ts             # SQL database for docs + versions

frontend/
  components/
    steering/
      DocViewer.tsx      # Markdown renderer
      DocEditor.tsx      # Edit mode
      DocChat.tsx        # Chat interface
      DocNav.tsx         # Navigation sidebar
  pages/
    SteeringWheel.tsx    # Main page

steering-docs/           # Actual markdown files (Git-tracked)
  rules.md
  facts.md
  procedures.md
  preferences.md
  coding-standards.md
  reports/
    2025-10-23.md
  wip.md
  tasks.md
  .steering-config.json  # Mandatory reading list for AI
```

### Pros
- ✅ **Perfectly integrated** with your existing project
- ✅ **Real-time editing** through Encore.ts APIs
- ✅ **Native chat interface** using AI API integration
- ✅ **Version control** via database + Git commits
- ✅ **Zero deployment complexity** - same as your app
- ✅ **Minimal overhead** - just markdown files + simple UI
- ✅ **Direct AI access** - agents read from `/steering-docs`
- ✅ **Enforced reading** via `.steering-config.json`
- ✅ **Full control** over features and UX
- ✅ **Single codebase** - no context switching

### Cons
- ❌ Custom implementation (but simple)
- ❌ No off-the-shelf templates
- ❌ Build your own features (version UI, search, etc.)

### AI-Agent Integration
**Perfect for AI agents:**
```json
// .steering-config.json
{
  "mandatory_reading": [
    "steering-docs/rules.md",
    "steering-docs/coding-standards.md",
    "steering-docs/wip.md"
  ],
  "context_files": [
    "steering-docs/facts.md",
    "steering-docs/preferences.md"
  ]
}
```

AI agents like Leap can:
1. Read `.steering-config.json` to know what to load
2. Parse markdown files directly (native format)
3. Call `/steering/chat_with_docs` API to query docs
4. Update docs via `/steering/update_doc` API

### Features to Build
1. **Doc Viewer** - Markdown rendering with syntax highlighting
2. **Doc Editor** - Simple textarea or Monaco editor
3. **Chat Interface** - Query docs using OpenAI/Anthropic
4. **Version History** - Database-backed with Git sync
5. **Navigation** - Auto-generated from file structure
6. **Search** - Simple text search across all docs

### Effort Estimate: **Low** (4-6 hours for MVP, extensible over time)

---

## Recommendation: **Option 4 - Custom Encore.ts Solution**

### Why This Is the Best Approach

#### 1. **Native Integration**
- Lives within your ScreenGraph project
- Same tech stack (Encore.ts + React)
- No separate deployment or maintenance
- Shares authentication, database, infrastructure

#### 2. **AI-First Design**
- Markdown files in predictable location (`/steering-docs`)
- Config file explicitly tells AI what to read
- REST APIs for programmatic access
- Chat interface built-in, not bolted-on

#### 3. **Solo Dev Friendly**
- Minimal setup - just markdown files + simple CRUD
- Iterate fast - edit and see changes immediately
- No build complexity - leverage Encore's auto-deployment
- Full control without framework constraints

#### 4. **Real-Time Capabilities**
- Edit docs through UI → instant Git commit
- Chat with docs → live updates to content
- Version tracking → automatic on every change
- No build/deploy cycle between edits

#### 5. **Scalable Yet Simple**
Start with basics:
- ✅ Markdown files
- ✅ Simple viewer
- ✅ Basic CRUD

Add features incrementally:
- → Chat interface when needed
- → Version UI when valuable
- → Advanced search later
- → Permissions if team grows

#### 6. **ScreenGraph Context**
As a SAAS product for UI/UX analysis, having internal docs in the same codebase:
- Demonstrates your own product's organization
- Shows how you structure complex systems
- Keeps everything in one mental model
- No tool-switching overhead

---

## Implementation Plan

### Phase 1: MVP (Today)
1. Create `/steering-docs` folder structure
2. Build basic Encore.ts CRUD endpoints
3. Simple React viewer with markdown rendering
4. `.steering-config.json` for AI agents

### Phase 2: Enhanced (This Week)
1. Add edit mode
2. Database versioning
3. Auto-commit to Git on changes
4. Navigation sidebar

### Phase 3: Advanced (As Needed)
1. Chat interface with AI
2. Version history UI
3. Search functionality
4. Diff viewer

---

## Comparison Matrix

| Feature | Docusaurus | Starlight | Notion | Custom Encore.ts |
|---------|-----------|-----------|--------|------------------|
| **AI-Agent Readable** | ✅ Markdown files | ✅ Markdown files | ❌ Proprietary API | ✅ Direct file access |
| **Setup Time** | 2-3 days | 1-2 days | 5 minutes | 4-6 hours |
| **Real-time Editing** | ❌ Build required | ❌ Build required | ✅ Instant | ✅ Instant |
| **Chat Interface** | ❌ Custom needed | ❌ Custom needed | ✅ Built-in AI | ✅ Custom (easy) |
| **Version Control** | ✅ Git + Built-in | ⚠️ Git only | ⚠️ Paid plans | ✅ DB + Git |
| **Mandatory Reading** | ⚠️ Possible | ⚠️ Possible | ❌ Impossible | ✅ Config-driven |
| **Deployment** | Separate | Separate | Cloud-hosted | Integrated |
| **Cost** | Free | Free | $0-10/month | Free (your infra) |
| **Context Switching** | ❌ Separate site | ❌ Separate site | ❌ External tool | ✅ Same codebase |
| **Customization** | ⚠️ Limited | ⚠️ Limited | ❌ Very limited | ✅ Full control |

---

## Conclusion

**Notion** is excellent for personal wikis and team collaboration, but **fundamentally incompatible** with the goal of AI-agent readable documentation. The proprietary format and API limitations create too much friction for programmatic access by Leap, Cursor, and Claude.

**Docusaurus** and **Starlight** are excellent tools for public documentation websites, but they're over-engineered for a solo dev's internal knowledge base that needs AI integration and real-time editing.

**Custom Encore.ts solution** gives you:
- Exactly what you need, nothing more
- Perfect AI agent integration
- Real-time collaboration with AI
- Zero deployment overhead
- Full control and extensibility

**Decision: Build custom Steering Wheel in Encore.ts**

Let's start with the foundation today and iterate based on actual usage patterns.
