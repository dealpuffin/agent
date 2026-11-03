# Dealpuffin tools

Remote MCP: `https://mcp.dealpuffin.com/mcp`. OAuth or `Authorization: Bearer` API key from https://dealpuffin.com/settings/api-keys. Keys only see tools selected at creation.

On every invoke, follow **Preamble** in `SKILL.md` (patch version check → `npx skills update dealpuffin -g -y`).

Fourteen tools. Read tools are annotated read-only; write tools are destructive (Claude Connectors).

| Tool | Auth | What it does |
| --- | --- | --- |
| `search_offers` | no | `q`, `category`, and/or `id`. Terms only. No code. |
| `reveal_offer` | yes | Returns the code; one claim per user per coupon. |
| `get_product` | yes* | Listing, media, public proofs, reviews. *Non-owners: verified https only. |
| `list_categories` | no | Subcategory slugs for submit/update. |
| `list_wishes` | category/product no; `mine` yes | Demand signal. Filing wishes is website-only. |
| `list_my_coupons` | yes | Owner imports with codes + reasons. |
| `submit_product` | yes | Create listing from `url` + category. |
| `update_product` | yes | Patch listing; optional `hidden`, `verify`, screenshots, video_url. `PATCH /api/v1/products/:slug` |
| `connect_coupon_provider` | yes | Connect/replace key + import, or omit `token` to sync. |
| `publish_coupon` | yes | `coupon_id`, optional `published`, `claim_limit`. |
| `connect_proof_point` | yes | Connect provider + first read. |
| `update_proof_config` | yes | `action`: sync \| disconnect \| cadence \| mode \| order. |
| `create_review` | yes | Review or reply (`review_id`). `POST /api/v1/reviews` |
| `submit_feedback` | yes | feature \| issue \| friction. |

## Proof providers

| `provider` | `field_name` | Credential |
| --- | --- | --- |
| `stripe` | `MRR` | Restricted `rk_` with Subscriptions read |
| `betterstack` | `Uptime` | Read-only API token; `monitor_id` if ambiguous |
| `cloudwatch` | `Uptime` | JSON access keys + `region`; `canary_name` if ambiguous |
| `gcp-monitoring` | `Uptime` | SA JSON (Monitoring Viewer); `check_id` if ambiguous |
| `google-analytics` | `Traffic` | SA JSON (GA4 Viewer); `property_id` if ambiguous |

Cadence: `daily` \| `weekly` \| `monthly`. Display: `exact` \| `band` \| `hidden` (`hidden` stays synced but is omitted from the public listing).

## Eligibility (listed offers)

Active promotion code; not locked to one customer; inside Stripe and Dealpuffin expiries; under both caps; founder published it onto a listing that matches any billing product-id limits.

## Intentional limits

- Banded proofs: non-owners get label (and color when applicable), not the number.
- Hidden proofs: omitted from public payloads; owner can change `display_mode` with `update_proof_config`.
- Create wish: website only.
- API key / OAuth revoke: Settings on the website.
