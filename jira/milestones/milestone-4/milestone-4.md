# Milestone 4 — Progress Detection & Graph Building

**Status:** 📅 Planned  
**Start Date:** TBD  
**Target Completion:** TBD  
**Owner:** Core Team

---

## 🎯 Goal
Build persistent ScreenGraph from crawl events, enabling replay, coverage analysis, and progress detection.

---

## 📦 Deliverables

### Graph Persistence
- [ ] Persist node writes screens to graph database
- [ ] Screen deduplication (perceptual hashing)
- [ ] Action edges with metadata
- [ ] Graph schema design (nodes, edges, properties)
- [ ] Incremental graph updates during crawl

### Progress Detection
- [ ] DetectProgress node compares current screen to history
- [ ] Loop detection (stuck in same screens)
- [ ] Coverage metrics (unique screens visited)
- [ ] Goal completion detection
- [ ] Termination criteria engine

### Graph Database
- [ ] Graph DB integration (Neo4j or similar)
- [ ] Query API for graph traversal
- [ ] Graph diff between crawl runs
- [ ] Performance optimization for large graphs

### Frontend
- [ ] Graph visualization (force-directed layout)
- [ ] Interactive node/edge exploration
- [ ] Replay mode: follow edge sequence
- [ ] Coverage heatmap
- [ ] Progress indicators

### Testing
- [ ] Graph construction correctness tests
- [ ] Deduplication accuracy tests
- [ ] Loop detection verification
- [ ] Large graph performance tests (1000+ nodes)

---

## ✅ Definition of Done
Crawls build persistent ScreenGraph, detect progress and loops, and display interactive graph visualization with replay capability.

---

## 🚀 Success Metrics
- [ ] Screen deduplication accuracy > 95%
- [ ] Graph query latency p95 < 200ms
- [ ] Graph rendering for 500 nodes < 2s
- [ ] Loop detection accuracy > 90%

---

## 🔗 Dependencies
- Milestone 3 (Reasoning & LLM) must be complete
- Graph database setup and configuration

---

## 📝 Notes
**Allowed Tech Debt for M4:**
- Simple perceptual hashing (no ML embeddings)
- In-memory graph for small crawls
- Basic graph layout algorithm
- No graph pruning/summarization
