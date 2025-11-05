# What We Are Making

**ScreenGraph: An Autonomous Mobile App Exploration Platform**

## The Vision

We are building **ScreenGraph** — a system that autonomously explores mobile applications and generates a living graph of every screen, action, and transition within an app. Think of it as creating a complete "map" of a mobile app without human intervention.

## What It Does

An AI-powered **agent** connects to a mobile device (via Appium), launches an app, and systematically explores it by:

1. **Capturing** screenshots and UI hierarchies at each step
2. **Understanding** what actions are possible (buttons, inputs, gestures)
3. **Executing** those actions (taps, swipes, text input)
4. **Detecting** when the app transitions to new screens
5. **Building** a persistent graph of unique screens and the edges (actions) that connect them

The result: A complete, replayable map of the app's structure that can be visualized, analyzed, and used for automated testing, UX analysis, or competitive research.

## How It Works

### Architecture

**Backend (Encore.ts):**
- **Agent Orchestrator**: XState-driven state machine that coordinates exploration
- **17 Pure Nodes**: Deterministic functions for Perceive → Act → Verify → Persist → Continue
- **Event Sourcing**: Every decision and action is recorded as an immutable event
- **State Snapshots**: Enables replay and resume from any point
- **Type-Safe API**: Full end-to-end type safety via Encore generated clients

**Frontend (SvelteKit):**
- **Timeline UI**: Real-time visualization of agent execution
- **Graph Visualization**: Interactive exploration of discovered screens
- **Run Management**: Start, monitor, and cancel exploration runs

### Core Principles

- **Deterministic**: Same inputs produce identical outputs (seeded RNG, replayable)
- **ID-First State**: State stores only references; heavy artifacts (screenshots, XML) live in object storage
- **Single Writer**: Orchestrator is the only component that writes events
- **Pure Nodes**: All agent logic is side-effect-free; I/O happens via ports/adapters
- **Enterprise-Grade**: Full replay capability, audit trails, and drift detection

## What Makes This Special

Unlike traditional mobile testing tools that require scripts, ScreenGraph:

- **Autonomously discovers** the entire app structure without human guidance
- **Builds a persistent graph** that grows across runs and can be queried
- **Records everything** as replayable events for debugging and analysis
- **Handles errors gracefully** with retries, backtracking, and recovery nodes
- **Scales horizontally** through event-driven architecture and worker pools

## Current State

✅ **Complete**: Agent orchestration infrastructure, structured logging, type-safe APIs, event sourcing  
🟡 **In Progress**: Node handler implementation, main loop execution  
⏳ **Upcoming**: LLM integration for action selection, graph visualization UI, multi-policy exploration

## The End Goal

ScreenGraph becomes the **definitive source of truth** for mobile app structure. Teams can:

- **Understand** app complexity through interactive graph visualization
- **Detect UX drift** by comparing graphs across app versions
- **Automate testing** using the discovered graph as a test suite foundation
- **Compare competitors** by analyzing their app structures side-by-side
- **Onboard faster** with visual exploration guides for new team members

We're not just building a testing tool — we're creating a **living, evolving map** of the mobile app universe.

## Features
Out of the below what is my architecture not ready for:
Test Web Views
Our visual approach allows you to test both native app components and Web Views seamlessly.

Test Cross-Platform
Save time by writing your tests once and running them across iOS, Android, and Web platforms.

Perform API Calls
Use API calls before, during, and after tests to seamlessly interact with your backend systems.

Test without Element IDs
Easily test Flutter, ReactNative, and other tech stacks, even those without unique IDs.

Test Deep Links
Easily test deep links by switching between apps and system screens during your tests.

Reuse Tests
Organize your test suite and reuse tests to reduce maintenance efforts across all your tests.

Test on Physical Devices
Run your tests on both virtual devices and the latest physical devices for iOS and Android.

Test UI languages
Save time by running the same tests across different UI languages. Test your app in  >180 languages.

Import & Export Tests
Import your existing tests and export into popular tools and frameworks.

Automatically handle unexpected screens and UI changes without adjusting tests.
