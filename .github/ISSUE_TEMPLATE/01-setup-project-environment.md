---
name: "Setup project/coding environment"
description: "Track tasks to establish the project's development environment"
title: "Setup project/coding environment"
labels: ["project-setup"]
assignees: []
---

## Goal
Establish the initial development environment and baseline workflows for ScreenGraph.

## Context
- Date created: 2025-09-30 18:58 (local)
- Project guidelines:
  - Keep all code modular
  - Use constants/enums wherever possible
  - Comment every function
  - No function > 50 lines

## Checklist
- [ ] Confirm repository metadata (name, description, topics)
- [ ] Choose and document primary stack (KMP, Jetpack Compose, Ktor)
- [ ] Add license (e.g., Apache-2.0/MIT)
- [ ] Add CODE_OF_CONDUCT.md and CONTRIBUTING.md
- [ ] Add .editorconfig and IDE code style schemes
- [ ] Set up ktlint/Spotless and format tasks
- [ ] Configure Gradle wrapper and versions catalog (libs.versions.toml)
- [ ] Add CI (build, test, lint) GitHub Actions workflow
- [ ] Configure branch protection rules
- [ ] Add PR template and additional issue templates
- [ ] Document local setup and quick start in README

## Acceptance Criteria
- Baseline CI is green on main/master
- Linting and formatting run locally and in CI
- Clear developer onboarding documented in README

## Notes
Add links, decisions, and constraints here.
