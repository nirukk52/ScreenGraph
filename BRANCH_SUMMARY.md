# Branch Summary: copilot/whats-going-on-branch

## Overview
This branch contains a major architectural addition to the ScreenGraph project - a comprehensive internal documentation and steering system called "Steering Wheel".

## Branch Information
- **Branch Name**: copilot/whats-going-on-branch
- **Current HEAD**: 6397e39 (Initial plan)
- **Parent Commit**: 8092ebb (Deduplicate split rule sections)

## What's Happening on This Branch

### Major Addition: Complete Documentation & Steering System

The primary commit (8092ebb) introduces a **complete internal documentation system** for the ScreenGraph project. This is a significant architectural enhancement that adds:

#### 1. **Steering Wheel UI Components** (`frontend/components/steering/`)
A full-featured documentation management interface:
- **DocNav.tsx**: Navigation sidebar for documentation categories
- **DocEditor.tsx**: Markdown editor with save functionality
- **DocViewer.tsx**: Documentation viewer with syntax highlighting
- **CategoryManager.tsx**: Manage documentation categories
- **Icon.tsx**: Icon wrapper component
- **SteeringDashboard.tsx**: Main dashboard for the steering system

#### 2. **Backend Steering Service** (`backend/steering/`)
Encore.ts-based API service providing:
- **steering.ts**: Main service with endpoints for:
  - `listCategories`: Get all doc categories
  - `listDocs`: List docs in a category
  - `getDoc`: Retrieve specific document
  - `updateDoc`: Save document changes
  - `getConfig`: Get steering configuration
- Full CRUD operations for documentation
- File system integration for markdown files
- Configuration management

#### 3. **Structured Documentation** (`backend/steering-docs/`)
A comprehensive, AI-agent-readable documentation structure:

**Categories:**
- **config/**: Configuration files (steering.config.json, mandatory-reading.json)
- **facts/**: Project facts (glossary, milestone index)
- **milestones/**: Milestone planning and tracking
- **preferences/**: Team preferences (AI persona, code style)
- **reports/**: Founder daily reports
- **rules/**: Project rules (coding standards, architecture, testing, naming)
- **tasks/**: Task management (today, upcoming, completed)
- **wip/**: Work in progress tracking

**Key Features:**
- Plain markdown format for AI-agent readability
- Version-controlled (Git)
- Centralized business memory
- Mandatory reading lists for AI agents

#### 4. **JIRA-Style Project Management** (`jira/`)
Complete project management structure:
- **bugs/**: Bug tracking system
- **feature-requests/**: Feature request tracking (FR-001 through FR-008)
- **milestones/**: 6 milestone directories with:
  - Milestone descriptions
  - Ticket trackers
  - Retrospectives
  - Action items
- **tech-debt/**: Technical debt tracking

**Sample Feature Requests:**
- FR-001: POST /run endpoint
- FR-002: GET /run/stream endpoint
- FR-003: POST /run/cancel endpoint
- FR-004: Orchestrator worker
- FR-005: Outbox publisher
- FR-006: Run database schema
- FR-007: Run outbox table schema
- FR-008: Timeline UI

#### 5. **Frontend Integration** (`frontend/pages/SteeringPage.tsx`)
- New route `/steering` for accessing the documentation system
- Full UI for viewing and editing documentation
- Chat interface capability (planned)

#### 6. **Project Infrastructure**
- **package.json**: Workspace configuration for monorepo (backend + frontend)
- **seed.md**: Original design document explaining the decision to build this system
- **DEVELOPMENT.md**: Complete setup and deployment instructions

## The Vision Behind This Branch

Based on `seed.md`, this system was designed to:

1. **AI-First**: Create documentation that AI agents (Leap, Cursor, Claude) can easily read and parse
2. **Chat-Enabled**: Allow real-time updates through conversational interface
3. **Version-Controlled**: Track all changes over time with Git
4. **Solo Dev Friendly**: Minimal complexity, maximum value
5. **Native Integration**: Built into ScreenGraph using its own tech stack (Encore.ts + React)

## Architecture

**Tech Stack:**
- **Backend**: Encore.ts (TypeScript with Encore framework)
- **Frontend**: React + Vite
- **Package Manager**: Bun
- **Storage**: File-based (Markdown files)
- **Database**: Encore's built-in database support

**Key Design Decisions:**
- Markdown files in predictable locations
- REST APIs for programmatic access
- Configuration files explicitly tell AI what to read
- No separate deployment - lives within ScreenGraph codebase

## Project Context

**ScreenGraph** is a SAAS product described as "A living map of your mobile app for UI/UX and competitive analysis"

This documentation system serves as:
- Business memory repository
- Development guidelines and standards
- AI agent instruction manual
- Project management tool
- Knowledge base for the product

## Current State

The branch is in a **ready-to-merge** state:
- ✅ All components implemented
- ✅ Documentation structure created
- ✅ Sample content populated
- ✅ Working tree clean
- ✅ No build errors expected

## What This Enables

1. **For Developers**:
   - Centralized source of truth for project information
   - Clear coding standards and architecture rules
   - Easy onboarding for new team members

2. **For AI Agents**:
   - Mandatory reading lists
   - Clear instructions and context
   - Ability to read and update documentation

3. **For Project Management**:
   - JIRA-style issue tracking
   - Milestone planning and retrospectives
   - Feature request management

4. **For the Business**:
   - Founder reports tracking
   - Strategic decision documentation
   - Product roadmap visibility

## Next Steps (If Merging)

1. Install dependencies: `bun install` (root), `npm install` (frontend)
2. Start backend: `cd backend && encore run`
3. Start frontend: `cd frontend && npx vite dev`
4. Access steering system at `/steering` route
5. Begin populating with actual project documentation

## Summary

This branch represents a **strategic investment in developer experience and AI-assisted development**. It's not just documentation - it's a complete system for managing project knowledge, standards, and memory in a way that both humans and AI agents can effectively use.

The implementation is production-ready and demonstrates:
- Full-stack capabilities
- Clean architecture
- AI-first thinking
- Solo developer pragmatism

**Bottom Line**: This branch adds a sophisticated internal documentation and project management system to ScreenGraph, enabling better collaboration between human developers and AI agents while maintaining simplicity and control.
