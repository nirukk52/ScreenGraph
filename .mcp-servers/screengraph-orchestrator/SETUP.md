# ScreenGraph MCP Orchestrator - Quick Setup

## 🚀 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd /Users/priyankalalge/ScreenGraph/Code/ScreenGraph/.mcp-servers/screengraph-orchestrator
pip install -r requirements.txt
```

### Step 2: Configure Cursor MCP

**Option A: Via Cursor Settings UI** (Recommended)
1. Open Cursor Settings → MCP Servers
2. Click "Add Server"
3. Name: `screengraph-orchestrator`
4. Command: `python`
5. Args: `/Users/priyankalalge/ScreenGraph/Code/ScreenGraph/.mcp-servers/screengraph-orchestrator/server.py`

**Option B: Via JSON Config**
Add to Cursor MCP settings JSON:
```json
{
  "mcpServers": {
    "screengraph-orchestrator": {
      "command": "python",
      "args": [
        "/Users/priyankalalge/ScreenGraph/Code/ScreenGraph/.mcp-servers/screengraph-orchestrator/server.py"
      ],
      "disabled": false
    }
  }
}
```

### Step 3: Restart Cursor

Restart Cursor to load the new MCP server.

### Step 4: Test It!

Try this in a Cursor chat:

```
@project-context Fix agent hanging on device connection
```

Or directly:

```
suggest_mcps(task: "Build navigation component")
```

## ✅ Success Indicators

You'll know it's working when:
- `@project-context` includes MCP recommendations
- You see "🎯 MCP Recommendations for: [task]" output
- Graphiti, Context7, and other MCPs are suggested intelligently

## 🎯 THE ONE COMMAND (Use Before EVERY Prompt)

```
@project-context [describe what you want to do]
```

**This single command:**
- ✅ Searches Graphiti for similar past work
- ✅ Gets intelligent MCP recommendations
- ✅ Recommends which vibe to load
- ✅ Surfaces relevant files and gotchas
- ✅ Provides actionable starting points

**Example:**
```
@project-context Fix agent stalling on privacy consent dialog
```

**Returns:**
- Past solutions from Graphiti
- Recommended MCPs: graphiti, encore-mcp, sequential-thinking
- Specific tools to call
- Workflow guidance
- Files to check

## 📚 Reference

**Full Documentation:** `README.md`  
**MCP Source:** `server.py`  
**Available MCPs:** 11 total (see README.md)

## 🐛 Troubleshooting

**Server not starting?**
- Check Python version: `python --version` (need 3.8+)
- Check dependencies: `pip list | grep mcp`
- Check path in MCP config (must be absolute)

**Not getting recommendations?**
- Restart Cursor completely
- Check MCP server logs in Cursor dev tools
- Try direct call: `suggest_mcps(task: "test")`

**Recommendations not relevant?**
- Be more specific in task description
- Include keywords: "backend", "frontend", "test", "deploy"
- Use `get_mcp_details("[mcp-name]")` for deep dive

---

**Created**: 2025-11-13  
**Version**: 1.0.0

