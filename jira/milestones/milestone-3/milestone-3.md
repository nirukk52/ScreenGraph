# Milestone 3 — Reasoning & LLM Streaming

**Status:** 📅 Planned  
**Start Date:** TBD  
**Target Completion:** TBD  
**Owner:** Core Team

---

## 🎯 Goal
Integrate vision models and LLM reasoning to enable autonomous crawl decision-making with real-time streaming of agent thought process.

---

## 📦 Deliverables

### Vision Integration
- [ ] Perceive node calls vision API with screenshots
- [ ] Screen understanding and element detection
- [ ] Accessibility tree parsing
- [ ] Visual-to-semantic mapping

### LLM Integration
- [ ] ChooseAction node with LLM streaming
- [ ] Token-by-token delta events
- [ ] Reasoning trace capture
- [ ] Action space definition and validation
- [ ] Prompt engineering for mobile exploration
- [ ] Token usage tracking and cost metrics

### Frontend
- [ ] Real-time reasoning display in timeline
- [ ] Token stream visualization
- [ ] Action decision highlighting
- [ ] Cost metrics dashboard

### Testing
- [ ] Mock LLM responses for deterministic tests
- [ ] Vision API integration tests
- [ ] Streaming delta event verification
- [ ] Reasoning quality evaluation

---

## ✅ Definition of Done
Crawls use vision + LLM to autonomously choose actions, stream reasoning tokens in real-time, and display decision-making process in UI.

---

## 🚀 Success Metrics
- [ ] LLM response time p95 < 5s
- [ ] Vision API latency p95 < 3s
- [ ] Reasoning quality: >80% valid actions
- [ ] Token cost per crawl step < $0.10

---

## 🔗 Dependencies
- Milestone 2 (Device Integration) must be complete
- Vision API access (OpenAI GPT-4V or similar)
- LLM API access with streaming support

---

## 📝 Notes
**Allowed Tech Debt for M3:**
- Simple action space (tap, swipe only - no complex gestures)
- No long-term memory across crawl sessions
- Basic prompt templates (no optimization)
- No multi-modal fusion (vision + text separate)
