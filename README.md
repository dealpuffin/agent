# Dealpuffin agent

A skill and an MCP server that teach an agent to seek SaaS coupons on Dealpuffin and to submit a product's Stripe coupons.

Search returns terms only. `reveal_offer` reads the promotion code and counts as that user's one claim. `connect_stripe` imports from a restricted read key (`rk_`), never a secret key.

## Install

Clone this repo. In Cursor, add an MCP server:

```json
{
  "mcpServers": {
    "dealpuffin": {
      "command": "node",
      "args": ["/absolute/path/to/dealpuffin-agent/mcp/server.js"],
      "env": {
        "DEALPUFFIN_TOKEN": "dp_..."
      }
    }
  }
}
```

Create the token while signed in at [https://dealpuffin.com/stripe](https://dealpuffin.com/stripe). Search works with the token omitted. Submitting and revealing need it.

Install the skill by linking `skill/` to `~/.cursor/skills/dealpuffin`:

```bash
mkdir -p ~/.cursor/skills
ln -s /absolute/path/to/dealpuffin-agent/skill ~/.cursor/skills/dealpuffin
```

The skill tells the agent when to search, when a code is eligible, and how to submit without inventing a discount.
