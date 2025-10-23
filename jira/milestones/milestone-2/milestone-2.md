# Milestone 2 — Device Integration & Artifacts

**Status:** 📅 Planned  
**Start Date:** TBD  
**Target Completion:** TBD  
**Owner:** Core Team

---

## 🎯 Goal
Integrate real Appium device actions and screenshot persistence to capture actual mobile app exploration evidence.

---

## 📦 Deliverables

### Device Integration
- [ ] Appium server integration
- [ ] Device pool management (acquire/release)
- [ ] Act node executes real device commands (tap, swipe, input)
- [ ] Device capability detection and session management
- [ ] Error handling for device disconnects/timeouts

### Artifact Storage
- [ ] Encore Object Storage integration
- [ ] Screenshot capture after each action
- [ ] XML view hierarchy capture
- [ ] Artifact upload to object storage
- [ ] Event schema updates to reference artifact URLs
- [ ] Artifact lifecycle policy (retention settings)

### Frontend
- [ ] Timeline displays screenshot thumbnails
- [ ] Lightbox view for full-size screenshots
- [ ] XML hierarchy viewer (collapsible tree)
- [ ] Artifact loading states and error handling

### Testing
- [ ] Mock Appium driver for unit tests
- [ ] Integration test with real emulator
- [ ] Artifact upload/download verification
- [ ] Performance test: 100 screenshots in single crawl

---

## ✅ Definition of Done
Crawl runs execute real device actions, capture screenshots and XML hierarchy, store artifacts in object storage, and display thumbnails in timeline UI.

---

## 🚀 Success Metrics
- [ ] Screenshot capture latency < 2s per action
- [ ] Object storage upload success rate > 99.9%
- [ ] Device pool utilization > 80%
- [ ] Timeline renders thumbnails without blocking

---

## 🔗 Dependencies
- Milestone 1 (Stream Backbone) must be complete
- Appium server setup and configuration
- Android emulator or physical device availability

---

## 📝 Notes
**Allowed Tech Debt for M2:**
- Single device (no parallelization across devices)
- No diff detection on screenshots
- Simple artifact retention (no cost optimization)
- No video recording (screenshots only)
