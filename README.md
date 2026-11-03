# Dealpuffin agent

Skill and optional stdio MCP proxy for Dealpuffin. Prefer the remote server at `https://mcp.dealpuffin.com/mcp`.

Fourteen workflow tools cover seeking deals, managing listings, billing, proof points, and reviews. Filing wishes is website-only.

## Install

### Claude (Claude Code and Cowork): skill + MCP in one plugin

```
/plugin marketplace add dealpuffin/agent
/plugin install dealpuffin@dealpuffin
```

This installs the skill and connects the remote MCP server (`https://mcp.dealpuffin.com/mcp`). Sign in with OAuth on first use. Turn on auto-update for the `dealpuffin` marketplace in `/plugin` to receive new versions. The skill skips its own update check inside a plugin.

### Cursor, Codex and other agents: skill

```bash
npx skills add dealpuffin/agent -g -y
```

`skills/dealpuffin/SKILL.md` carries `metadata.version`. Agents compare that to `main` once per session and run `npx skills update dealpuffin -g -y` when behind. Bump the **patch** digit only when you change the skill, and keep `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` on the same version.

Then add the remote MCP server to the host.

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

## License

MIT. See [LICENSE](LICENSE).
