# ScreenGraph - Documentation System Evaluation - This is where it all began!

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

**Decision: Build custom Steering Wheel in Encore.ts**

Let's start with the foundation today and iterate based on actual usage patterns.
