# Dealpuffin agent

A skill and an MCP server that teach an agent to seek SaaS coupons on Dealpuffin and to submit a product's Stripe coupons.

Search returns terms only. `reveal_offer` reads the promotion code and counts as that user's one claim. `connect_stripe` imports from a restricted read key (`rk_`), never a secret key.

## Install

In Cursor, add the remote server. OAuth asks the publisher to sign in.

```json
{
  "mcpServers": {
    "dealpuffin": {
      "url": "https://mcp.dealpuffin.com/mcp"
    }
  }
}
```

Any signed-in account can instead create an API key at [https://dealpuffin.com/settings/api-keys](https://dealpuffin.com/settings/api-keys) and send it as a bearer token. The key is shown once. It can use only the tools that were turned on.

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

A local stdio server is in `mcp/server.js` for clients that cannot open a remote URL. Set `DEALPUFFIN_TOKEN` to the same API key.

Install the skill by linking `skill/` to `~/.cursor/skills/dealpuffin`:

```bash
mkdir -p ~/.cursor/skills
ln -s /absolute/path/to/dealpuffin-agent/skill ~/.cursor/skills/dealpuffin
```

The skill tells the agent when to search, when a code is eligible, and how to submit without inventing a discount.
