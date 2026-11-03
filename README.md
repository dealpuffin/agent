# Dealpuffin agent

Skill and plugin for Dealpuffin, connected to the remote MCP server at `https://mcp.dealpuffin.com/mcp`.

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

Hosts that only speak stdio can reach the same URL through an MCP bridge such as `mcp-remote`.

## What the skill fetches and runs

The skill checks for a newer version once per session: it reads `skills/dealpuffin/SKILL.md` from `raw.githubusercontent.com/dealpuffin/agent/main` and compares `metadata.version`. When you installed it with `npx skills`, a newer version triggers `npx skills update dealpuffin -g -y`. Inside the Claude plugin this check is skipped, and the plugin manager handles updates. The skill sends no data anywhere else. Its tools call the Dealpuffin MCP server, and `reveal_offer` counts as one claim. The skill never logs or repeats billing keys; they appear only in the `connect_coupon_provider` call.

## License

MIT. See [LICENSE](LICENSE).
