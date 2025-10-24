.PHONY: run:demo test help

help:
	@echo "ScreenGraph Agent System - Available Commands:"
	@echo ""
	@echo "  make run:demo     - Run the agent demo (executes full setup + stubbed loop)"
	@echo "  make test         - Run all tests (determinism, idempotency, golden run)"
	@echo "  make help         - Show this help message"
	@echo ""

run:demo:
	@echo "Running ScreenGraph Agent Demo..."
	@cd backend && npx tsx agent/cli/demo.ts

test:
	@echo "Running ScreenGraph Agent Tests..."
	@cd backend && npm test
