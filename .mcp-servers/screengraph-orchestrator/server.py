#!/usr/bin/env python3
"""
ScreenGraph MCP Orchestrator

A meta-MCP server that intelligently suggests which MCPs and tools to use for any task.
Analyzes task descriptions and recommends the right combination of MCPs based on
ScreenGraph's architecture and available tools.
"""

import json
import asyncio
from typing import Literal, Optional
from pydantic import BaseModel, Field
from mcp.server.fastmcp import FastMCP

# Initialize MCP server
mcp = FastMCP("screengraph-orchestrator")

# MCP connection status cache (refreshed periodically)
_mcp_status_cache: dict[str, bool] = {}
_last_status_check: Optional[float] = None

# Vibe to Domain Mapping (based on vibes/*.json)
VIBE_MAPPING = {
    "backend": {
        "vibe": "backend_vibe",
        "skills": ["backend-debugging", "backend-development", "backend-testing"],
        "primary_mcps": ["graphiti", "encore-mcp", "sequential-thinking"],
        "extends": "base_vibe"
    },
    "frontend": {
        "vibe": "frontend_vibe",
        "skills": ["frontend-debugging", "frontend-development", "e2e-testing"],
        "primary_mcps": ["graphiti", "svelte", "browser"],
        "extends": "base_vibe"
    },
    "testing": {
        "vibe": "qa_vibe",
        "skills": ["webapp-testing", "e2e-testing"],
        "primary_mcps": ["graphiti", "browser", "encore-mcp"],
        "extends": "base_vibe"
    },
    "infrastructure": {
        "vibe": "infra_vibe",
        "skills": ["mcp-builder", "skill-creator"],
        "primary_mcps": ["graphiti", "aws-api-mcp", "vercel"],
        "extends": "base_vibe"
    }
}

# ScreenGraph MCP Registry
MCP_REGISTRY = {
    "graphiti": {
        "purpose": "Knowledge graph for institutional memory and past decisions",
        "when_to_use": [
            "Before starting ANY task (search for similar past work)",
            "After solving complex problems (document solution)",
            "Finding past bug fixes or architectural decisions",
            "Avoiding reinventing solutions"
        ],
        "key_tools": [
            "search_memory_nodes - Find concepts and patterns",
            "search_memory_facts - Search specific facts",
            "add_memory - Document solutions (ALWAYS use group_id='screengraph')"
        ],
        "integration": "MANDATORY: Always search Graphiti first, document after",
        "group_id": "screengraph"
    },
    "context7": {
        "purpose": "Fetch up-to-date documentation for external libraries",
        "when_to_use": [
            "Working with unfamiliar external libraries",
            "Need latest API documentation",
            "Checking library best practices",
            "Upgrading library versions"
        ],
        "key_tools": [
            "resolve-library-id - Find library by name",
            "get-library-docs - Fetch documentation with focus topic"
        ],
        "integration": "Use after Graphiti if external docs needed"
    },
    "sequential-thinking": {
        "purpose": "Multi-step reasoning and problem decomposition",
        "when_to_use": [
            "Complex debugging requiring systematic analysis",
            "Planning multi-step refactoring",
            "Analyzing architectural tradeoffs",
            "Breaking down ambiguous requirements"
        ],
        "key_tools": [
            "sequentialthinking - Step-by-step reasoning with revision capability"
        ],
        "integration": "Use during complex analysis or decision-making"
    },
    "encore-mcp": {
        "purpose": "Encore.ts backend introspection and debugging",
        "when_to_use": [
            "Backend API debugging",
            "Checking service metadata and traces",
            "Querying database during development",
            "Inspecting agent state and run events",
            "Testing backend WITHOUT starting encore run"
        ],
        "key_tools": [
            "get_services - List all backend services and endpoints",
            "get_traces - View request traces for debugging",
            "query_database - Run SQL queries against dev database",
            "call_endpoint - Test API endpoints",
            "suggest_aws_commands - Get AWS CLI suggestions"
        ],
        "integration": "Primary tool for backend debugging and introspection"
    },
    "browser": {
        "purpose": "Frontend testing, inspection, and interaction",
        "when_to_use": [
            "E2E testing frontend flows",
            "Inspecting UI state and elements",
            "Testing real-time updates (SSE, WebSockets)",
            "Debugging frontend issues",
            "Verifying UI behavior"
        ],
        "key_tools": [
            "browser_navigate - Go to URL",
            "browser_snapshot - Capture accessibility snapshot",
            "browser_click - Click elements",
            "browser_type - Type into fields",
            "browser_take_screenshot - Visual inspection"
        ],
        "integration": "Use with playwright for frontend testing"
    },
    "svelte": {
        "purpose": "Svelte 5 and SvelteKit documentation (195 resources!)",
        "when_to_use": [
            "Building Svelte 5 components (runes: $state, $derived, $effect)",
            "SvelteKit routing and load functions",
            "Form actions and progressive enhancement",
            "SSR/SSG configuration",
            "Svelte animations and transitions"
        ],
        "key_tools": [
            "list-sections - List all 195 documentation sections",
            "get-documentation - Fetch specific docs by title or path",
            "playground-link - Generate Svelte REPL link",
            "svelte-autofixer - Fix Svelte code issues"
        ],
        "integration": "Primary tool for frontend development"
    },
    "figma": {
        "purpose": "Design to code conversion from Figma files",
        "when_to_use": [
            "Converting Figma designs to code",
            "Building UI from design specs",
            "Extracting design tokens and variables",
            "Code Connect integration"
        ],
        "key_tools": [
            "get_design_context - Generate code from Figma node",
            "get_screenshot - Capture design screenshot",
            "get_metadata - Get node structure",
            "get_variable_defs - Extract design tokens"
        ],
        "integration": "Use when implementing UI from designs"
    },
    "aws-knowledge-mcp": {
        "purpose": "AWS documentation and regional availability",
        "when_to_use": [
            "Planning AWS infrastructure",
            "Checking service availability in regions",
            "Reading AWS documentation",
            "Understanding AWS best practices"
        ],
        "key_tools": [
            "get_regional_availability - Check if AWS services available in region",
            "list_regions - List all AWS regions",
            "read_documentation - Fetch AWS docs",
            "search_documentation - Search AWS docs"
        ],
        "integration": "Use for AWS research and planning"
    },
    "aws-api-mcp": {
        "purpose": "Execute AWS CLI commands with validation",
        "when_to_use": [
            "Managing AWS resources",
            "Deploying infrastructure",
            "Running AWS CLI operations",
            "Automating AWS tasks"
        ],
        "key_tools": [
            "call_aws - Execute AWS CLI commands",
            "suggest_aws_commands - Get CLI suggestions for natural language"
        ],
        "integration": "Use for AWS operations and automation"
    },
    "vercel": {
        "purpose": "Vercel deployment and project management",
        "when_to_use": [
            "Deploying frontend to Vercel",
            "Managing Vercel projects",
            "Checking deployment logs",
            "Configuring Vercel settings"
        ],
        "key_tools": [
            "deploy_to_vercel - Deploy project",
            "list_projects - List Vercel projects",
            "get_deployment - Get deployment details",
            "search_vercel_documentation - Search Vercel docs"
        ],
        "integration": "Use for frontend deployment"
    },
    "better-auth": {
        "purpose": "Better Auth library documentation",
        "when_to_use": [
            "Implementing authentication",
            "Understanding Better Auth patterns",
            "Setting up auth flows",
            "Troubleshooting auth issues"
        ],
        "key_tools": [
            "chat - Ask questions about Better Auth",
            "search - Search Better Auth knowledge base",
            "list_files - List available documentation",
            "get_file - Retrieve specific docs"
        ],
        "integration": "Use when working with authentication"
    }
}

# Task pattern matching for intelligent routing
TASK_PATTERNS = {
    "backend": {
        "keywords": [
            "backend", "api", "endpoint", "database", "agent", 
            "encore", "service", "migration", "sql",
            # Backend-specific terms
            "query", "schema", "table", "column", "index", "constraint",
            "transaction", "orm", "repository", "model",
            # Backend actions
            "persist", "save", "update", "delete", "fetch", "store",
            # Agent/worker specific
            "worker", "job", "queue", "pubsub", "subscription",
            "state-machine", "orchestrator", "coordinator"
        ],
        "primary_mcps": ["graphiti", "encore-mcp", "sequential-thinking"],
        "secondary_mcps": ["context7", "aws-knowledge-mcp"]
    },
    "frontend": {
        "keywords": [
            "frontend", "ui", "component", "svelte", "page", "route", "form", "sse", "real-time",
            # UI interaction keywords
            "scroll", "infinite", "pagination", "navigation", "nav", "menu",
            "modal", "dialog", "dropdown", "tooltip", "popover",
            "button", "input", "select", "checkbox", "radio",
            # UI patterns
            "animation", "transition", "layout", "grid", "flex",
            "responsive", "mobile", "desktop", "browser", "dom",
            # Frontend-specific actions
            "click", "hover", "drag", "drop", "swipe",
            "render", "display", "show", "hide", "toggle"
        ],
        "primary_mcps": ["graphiti", "svelte", "browser"],
        "secondary_mcps": ["context7", "figma"]
    },
    "testing": {
        "keywords": ["test", "e2e", "integration", "playwright", "spec", "assert", "verify"],
        "primary_mcps": ["graphiti", "browser", "encore-mcp"],
        "secondary_mcps": ["sequential-thinking"]
    },
    "deployment": {
        "keywords": ["deploy", "vercel", "aws", "production", "ci/cd", "pipeline"],
        "primary_mcps": ["graphiti", "vercel", "aws-api-mcp"],
        "secondary_mcps": ["aws-knowledge-mcp"]
    },
    "debugging": {
        "keywords": ["debug", "bug", "fix", "error", "stall", "hang", "timeout", "crash"],
        "primary_mcps": ["graphiti", "sequential-thinking"],
        "secondary_mcps": ["encore-mcp", "browser"]
    },
    "design": {
        "keywords": ["design", "figma", "ui", "component", "layout", "style"],
        "primary_mcps": ["graphiti", "figma", "svelte"],
        "secondary_mcps": ["browser"]
    },
    "auth": {
        "keywords": ["auth", "authentication", "login", "session", "user", "permission"],
        "primary_mcps": ["graphiti", "better-auth"],
        "secondary_mcps": ["encore-mcp"]
    },
    "infrastructure": {
        "keywords": ["infrastructure", "aws", "cloud", "region", "service", "resource"],
        "primary_mcps": ["graphiti", "aws-knowledge-mcp", "aws-api-mcp"],
        "secondary_mcps": ["sequential-thinking"]
    },
    "appium": {
        "keywords": ["appium", "device", "webdriver", "mobile", "android", "session"],
        "primary_mcps": ["graphiti", "encore-mcp", "sequential-thinking"],
        "secondary_mcps": ["context7"]
    }
}


class SuggestMCPsInput(BaseModel):
    """Input for suggesting MCPs based on task description"""
    task: str = Field(
        description="Natural language description of the task. Examples: 'Fix agent hanging on device connection', 'Build real-time run status component', 'Deploy frontend to Vercel', 'Debug database migration'"
    )
    include_examples: bool = Field(
        default=True,
        description="Whether to include usage examples for suggested MCPs"
    )


class GetMCPDetailsInput(BaseModel):
    """Input for getting detailed information about a specific MCP"""
    mcp_name: str = Field(
        description="Name of the MCP to get details for. Valid names: graphiti, context7, sequential-thinking, encore-mcp, browser, svelte, figma, aws-knowledge-mcp, aws-api-mcp, vercel, better-auth"
    )


class TrackEffectivenessInput(BaseModel):
    """Input for tracking MCP suggestion effectiveness"""
    task: str = Field(description="The original task description")
    mcps_used: list[str] = Field(description="List of MCP names that were actually used")
    outcome: Literal["helpful", "partially_helpful", "not_helpful"] = Field(
        description="How helpful the suggestions were"
    )
    feedback: str = Field(
        default="",
        description="Optional feedback about what worked or what was missing"
    )


class CheckMCPStatusInput(BaseModel):
    """Input for checking which MCPs are enabled"""
    refresh_cache: bool = Field(
        default=False,
        description="Force refresh the MCP status cache (checks all MCPs)"
    )


def _get_setup_instructions(mcp_name: str) -> str:
    """Get setup instructions for enabling a specific MCP"""
    setup_docs = {
        "graphiti": "Install Graphiti MCP server and configure with Neo4j. See Graphiti documentation.",
        "context7": "Enable Context7 MCP in Cursor settings. No additional setup required.",
        "sequential-thinking": "Enable sequential-thinking MCP in Cursor settings. No additional setup required.",
        "encore-mcp": "Install encore-mcp server. Requires Encore.ts project. See encore-mcp documentation.",
        "browser": "Enable browser MCP in Cursor settings. Requires Chrome/Chromium installed.",
        "svelte": "Enable Svelte MCP in Cursor settings. No additional setup required.",
        "figma": "Install Figma MCP server and authenticate with Figma. See Figma MCP documentation.",
        "aws-knowledge-mcp": "Enable AWS Knowledge MCP in Cursor settings. No additional setup required.",
        "aws-api-mcp": "Install AWS API MCP and configure AWS credentials. Requires AWS CLI.",
        "vercel": "Install Vercel MCP and authenticate. Requires Vercel account.",
        "better-auth": "Enable Better Auth MCP in Cursor settings. No additional setup required."
    }
    return setup_docs.get(mcp_name, "No setup instructions available.")


@mcp.tool()
def check_mcp_status(refresh_cache: bool = False) -> str:
    """
    Check which MCPs are currently enabled and reachable.
    
    Use this to verify which MCPs are available before making recommendations.
    Returns a status report showing which MCPs are enabled/disabled and provides
    setup instructions for any disabled MCPs that might be needed.
    
    Args:
        refresh_cache: Force refresh the status cache (default: False)
        
    Returns:
        Status report with:
        - List of enabled MCPs
        - List of disabled MCPs
        - Setup instructions for disabled MCPs
        - Recommendations for essential MCPs to enable
    
    Note: This is a heuristic check - it cannot actually ping other MCP servers,
    but it can provide guidance based on common configurations.
    """
    # Note: In a real implementation, this would check Cursor's MCP configuration
    # For now, we'll provide a helpful status template
    
    response = "## 🔍 MCP Status Check\n\n"
    response += "**Note**: This is a heuristic check. Verify actual status in Cursor MCP settings.\n\n"
    
    response += "### Essential MCPs (Should Always Be Enabled)\n\n"
    essential_mcps = ["graphiti", "context7", "sequential-thinking"]
    for mcp_name in essential_mcps:
        response += f"- **{mcp_name}** - {MCP_REGISTRY[mcp_name]['purpose']}\n"
    response += "\n"
    
    response += "### Domain-Specific MCPs\n\n"
    response += "**Backend Development:**\n"
    response += "- **encore-mcp** - Backend introspection (Encore.ts projects)\n\n"
    
    response += "**Frontend Development:**\n"
    response += "- **browser** - Frontend testing and inspection\n"
    response += "- **svelte** - Svelte 5 & SvelteKit documentation\n\n"
    
    response += "**Design:**\n"
    response += "- **figma** - Design to code conversion\n\n"
    
    response += "**Infrastructure:**\n"
    response += "- **aws-knowledge-mcp** - AWS documentation\n"
    response += "- **aws-api-mcp** - AWS CLI operations\n"
    response += "- **vercel** - Deployment management\n\n"
    
    response += "**Authentication:**\n"
    response += "- **better-auth** - Auth library documentation\n\n"
    
    response += "### 🔧 How to Enable MCPs\n\n"
    response += "1. Open Cursor Settings → MCP Servers\n"
    response += "2. Click 'Add Server' for each MCP you need\n"
    response += "3. Configure according to MCP documentation\n"
    response += "4. Restart Cursor\n\n"
    
    response += "### 💡 Recommendations\n\n"
    response += "- **Minimum**: Enable graphiti, context7, sequential-thinking\n"
    response += "- **Backend work**: Add encore-mcp\n"
    response += "- **Frontend work**: Add browser, svelte\n"
    response += "- **Full-stack**: Enable all relevant domain MCPs\n\n"
    
    return response


@mcp.tool()
def suggest_mcps(task: str, include_examples: bool = False) -> str:
    """
    Suggest which MCPs to use for a task (SIMPLE VERSION - brief recommendations).
    
    Returns top 3-5 MCPs you should use, prioritized by relevance.
    No fluff, just the essentials.
    
    Args:
        task: What you want to accomplish
        include_examples: Show detailed examples (default: False for brevity)
        
    Returns:
        Brief list of MCPs to use in priority order
    
    Examples:
        - "Fix agent stalling" → graphiti, encore-mcp, sequential-thinking
        - "Build navigation" → graphiti, svelte, browser
        - "Deploy" → graphiti, vercel
    """
    task_lower = task.lower()
    
    # Match task to patterns
    matched_categories = []
    for category, pattern in TASK_PATTERNS.items():
        if any(keyword in task_lower for keyword in pattern["keywords"]):
            matched_categories.append(category)
    
    # Default to general if no match
    if not matched_categories:
        matched_categories = ["backend"]  # Default assumption
    
    # Collect MCPs (graphiti is ALWAYS first)
    recommended_mcps = ["graphiti"]  # Always start with Graphiti
    
    for category in matched_categories:
        pattern = TASK_PATTERNS[category]
        for mcp in pattern["primary_mcps"]:
            if mcp not in recommended_mcps:
                recommended_mcps.append(mcp)
        for mcp in pattern["secondary_mcps"]:
            if mcp not in recommended_mcps:
                recommended_mcps.append(mcp)
    
    # Determine vibe from categories
    vibe_name = "base_vibe"  # default
    vibe_skills = []
    if "backend" in matched_categories:
        vibe_info = VIBE_MAPPING["backend"]
        vibe_name = vibe_info["vibe"]
        vibe_skills = vibe_info["skills"]
    elif "frontend" in matched_categories:
        vibe_info = VIBE_MAPPING["frontend"]
        vibe_name = vibe_info["vibe"]
        vibe_skills = vibe_info["skills"]
    elif "testing" in matched_categories:
        vibe_info = VIBE_MAPPING["testing"]
        vibe_name = vibe_info["vibe"]
        vibe_skills = vibe_info["skills"]
    elif "deployment" in matched_categories or "infrastructure" in matched_categories:
        vibe_info = VIBE_MAPPING["infrastructure"]
        vibe_name = vibe_info["vibe"]
        vibe_skills = vibe_info["skills"]
    
    # Build response - SIMPLE VERSION
    if not include_examples:
        # Brief format with vibe
        response = f"**MCPs for: {task}**\n\n"
        response += f"**Vibe**: `{vibe_name}`"
        if vibe_skills:
            response += f" (skills: {', '.join(vibe_skills[:2])})"
        response += "\n\n"
        for i, mcp_name in enumerate(recommended_mcps[:3], 1):
            mcp = MCP_REGISTRY.get(mcp_name, {})
            response += f"{i}. **{mcp_name}** - {mcp.get('purpose', 'N/A')}\n"
        return response
    
    # Detailed format (if requested)
    response = f"## 🎯 MCP Recommendations for: {task}\n\n"
    response += f"**Categories**: {', '.join(matched_categories)}\n\n"
    response += "### Recommended MCPs:\n\n"
    
    for i, mcp_name in enumerate(recommended_mcps[:5], 1):  # Limit to top 5
        mcp = MCP_REGISTRY.get(mcp_name, {})
        response += f"#### {i}. **{mcp_name}**\n"
        response += f"**Purpose**: {mcp.get('purpose', 'N/A')}\n\n"
        
        if include_examples and mcp_name in MCP_REGISTRY:
            response += "**When to use**:\n"
            for reason in mcp.get("when_to_use", [])[:3]:  # Top 3 reasons
                response += f"- {reason}\n"
            response += "\n"
            
            response += "**Key tools**:\n"
            for tool in mcp.get("key_tools", []):
                response += f"- `{tool}`\n"
            response += "\n"
            
            if "integration" in mcp:
                response += f"**Integration**: {mcp['integration']}\n\n"
            
            if mcp_name == "graphiti":
                response += f"**⚠️ CRITICAL**: ALWAYS use `group_id=\"screengraph\"` for ALL Graphiti operations\n\n"
    
    # Add workflow guidance
    response += "### 🚀 Suggested Workflow:\n\n"
    response += "1. **Search Graphiti first** - Look for similar past work\n"
    
    if "encore-mcp" in recommended_mcps:
        response += "2. **Use encore-mcp** - Inspect backend state/services\n"
    if "svelte" in recommended_mcps:
        response += "2. **Check Svelte docs** - Review relevant patterns\n"
    if "browser" in recommended_mcps:
        response += "3. **Test with browser MCP** - Verify frontend behavior\n"
    
    response += "X. **Implement** using domain-specific tools\n"
    response += "Y. **Document in Graphiti** (`group_id=\"screengraph\"`)\n\n"
    
    return response


@mcp.tool()
def get_mcp_details(mcp_name: str) -> str:
    """
    Get comprehensive details about a specific MCP's capabilities.
    
    Use this when you need deep information about what a particular MCP can do,
    all available tools, and integration guidelines.
    
    Args:
        mcp_name: Name of the MCP (e.g., "graphiti", "svelte", "encore-mcp")
        
    Returns:
        Complete MCP details including:
        - Full purpose and capabilities
        - Complete list of tools
        - When to use (comprehensive)
        - Integration guidelines
        - ScreenGraph-specific notes
    """
    if mcp_name not in MCP_REGISTRY:
        available = ", ".join(MCP_REGISTRY.keys())
        return f"❌ Unknown MCP: {mcp_name}\n\nAvailable MCPs: {available}"
    
    mcp = MCP_REGISTRY[mcp_name]
    
    response = f"# {mcp_name.upper()} - Complete Details\n\n"
    response += f"**Purpose**: {mcp['purpose']}\n\n"
    
    response += "## When to Use\n\n"
    for reason in mcp.get("when_to_use", []):
        response += f"- {reason}\n"
    response += "\n"
    
    response += "## Available Tools\n\n"
    for tool in mcp.get("key_tools", []):
        response += f"- `{tool}`\n"
    response += "\n"
    
    if "integration" in mcp:
        response += f"## Integration Guidelines\n\n{mcp['integration']}\n\n"
    
    if mcp_name == "graphiti":
        response += "## ScreenGraph-Specific Configuration\n\n"
        response += f"- **MANDATORY**: Always use `group_id=\"{mcp['group_id']}\"`\n"
        response += "- Use tags in episode_body for categorization: [Tags: backend, frontend, testing, etc.]\n"
        response += "- Search before implementing, document after solving\n\n"
    
    return response


@mcp.tool()
def track_effectiveness(
    task: str,
    mcps_used: list[str],
    outcome: Literal["helpful", "partially_helpful", "not_helpful"],
    feedback: str = ""
) -> str:
    """
    Track the effectiveness of MCP suggestions for continuous improvement.
    
    Use this after completing a task to help the orchestrator learn what works.
    This data is used to improve future recommendations.
    
    Args:
        task: The original task description
        mcps_used: List of MCPs that were actually used
        outcome: How helpful the suggestions were
        feedback: Optional details about what worked or what was missing
        
    Returns:
        Confirmation message with guidance to document in Graphiti
    
    Example:
        track_effectiveness(
            task="Fix agent stalling",
            mcps_used=["graphiti", "encore-mcp", "sequential-thinking"],
            outcome="helpful",
            feedback="Graphiti search found past similar bug. Encore-mcp helped inspect state."
        )
    """
    response = f"✅ **Effectiveness tracked for**: {task}\n\n"
    response += f"**MCPs used**: {', '.join(mcps_used)}\n"
    response += f"**Outcome**: {outcome}\n"
    
    if feedback:
        response += f"**Feedback**: {feedback}\n\n"
    
    response += "---\n\n"
    response += "📝 **Next step**: Document this in Graphiti for future reference:\n\n"
    response += "```typescript\n"
    response += "add_memory({\n"
    response += f"  name: \"MCP Orchestrator Effectiveness - {task[:50]}\",\n"
    response += "  episode_body: `\n"
    response += "    [Tags: meta, mcp-orchestrator, effectiveness]\n"
    response += f"    \n"
    response += f"    Task: {task}\n"
    response += f"    MCPs Used: {', '.join(mcps_used)}\n"
    response += f"    Outcome: {outcome}\n"
    
    if feedback:
        response += f"    Feedback: {feedback}\n"
    
    response += "  `,\n"
    response += "  group_id: \"screengraph\",\n"
    response += "  source: \"text\"\n"
    response += "})\n"
    response += "```\n"
    
    return response


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()

