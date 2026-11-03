# Dealpuffin agent

Skill and optional stdio MCP proxy for Dealpuffin. Prefer the remote server at `https://mcp.dealpuffin.com/mcp`.

Fourteen workflow tools cover seeking deals, managing listings, billing, proof points, and reviews. Filing wishes is website-only.

## Install

```bash
npx skills add dealpuffin/agent -g -y
```

`skills/dealpuffin/SKILL.md` carries `metadata.version`. Agents compare that to `main` on every invoke and run `npx skills update dealpuffin -g -y` when behind. Bump the **patch** digit only when you change the skill.

In Cursor, add the remote server:

```json
{
  "mcpServers": {
    "dealpuffin": {
      "url": "https://mcp.dealpuffin.com/mcp"
    }
  }
}
```

Or an API key:

```json
{
  "mcpServers": {
    "dealpuffin": {
      "url": "https://mcp.dealpuffin.com/mcp",
      "headers": {
        "Authorization": "Bearer dp_..."
      }
    }
  }
}
```

A local stdio proxy is in `mcp/server.js` for hosts that cannot open a remote URL. Set `DEALPUFFIN_TOKEN`. Prefer the remote MCP when possible.
