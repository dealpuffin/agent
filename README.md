# Dealpuffin agent

A skill and an MCP server that teach an agent to seek SaaS coupons on Dealpuffin, submit a product's coupons, and attach proof points (MRR, uptime, traffic).

Search returns terms only. `reveal_offer` reads the promotion code and counts as that user's one claim. `connect_coupon_provider` imports from a restricted read key (`rk_` for Stripe), never a secret key. `connect_proof_point` attaches a verified reading; confirm with `get_product`.

## Install

```bash
npx skills add dealpuffin/agent -g -y
```

That installs the skill for your agents. The skill uses the remote MCP server. OAuth asks the person to sign in. That agent can act as them until they remove it at Settings.

`skills/dealpuffin/SKILL.md` carries `metadata.version`. Agents are instructed to compare that to `main` on every invoke and run `npx skills update dealpuffin -g -y` when behind, so they follow the latest instructions. Bump the version whenever you change the skill.

In Cursor, you can also add the remote server by hand.

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

A local stdio server is in `mcp/server.js` for clients that cannot open a remote URL. Set `DEALPUFFIN_TOKEN` to the same API key. It offers only the tools that key has.

Install the skill by linking `skills/dealpuffin` to `~/.cursor/skills/dealpuffin`:

```bash
mkdir -p ~/.cursor/skills
ln -s /absolute/path/to/agent/skills/dealpuffin ~/.cursor/skills/dealpuffin
```

The skill tells the agent when to search, when a code is eligible, and how to submit without inventing a discount.
