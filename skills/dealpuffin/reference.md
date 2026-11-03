# Dealpuffin tools

Skill version lives in `SKILL.md` frontmatter as `metadata.version`. On every invoke, follow that file's **Preamble**: compare to `https://raw.githubusercontent.com/dealpuffin/agent/main/skills/dealpuffin/SKILL.md`, and if remote is newer run `npx skills update dealpuffin -g -y` (or `npx skills add dealpuffin/agent -g -y`), then re-read the skill before continuing.

Remote MCP: `https://mcp.dealpuffin.com/mcp`. OAuth signs the person in. Or send an API key from https://dealpuffin.com/settings/api-keys as `Authorization: Bearer`. A key can call only the tools selected when it was created. `sync_coupons` and `connect_coupon_provider` omit the code unless that key also has `list_my_coupons`. Proof points need `connect_proof_point` (and `sync_proof_points` to re-read). The person can remove an OAuth agent on that same settings page.

The HTTP API base is `DEALPUFFIN_API_BASE` or `https://dealpuffin.com`. Search, get, `list_categories`, and `list_wishes` for a category or a product do not need a key. `list_wishes` with `mine` does. Every other call does.

| Tool | Auth | What it does |
| --- | --- | --- |
| `search_offers` | no | `q` and `category` optional. Terms only. No code. May include public proof points. |
| `get_offer` | no | One offer by id. No code. May include public proof points. |
| `get_product` | no for verified https; owner token for pending | One listing, including public proof points. Use after `connect_proof_point` to confirm. |
| `reveal_offer` | yes | Returns the code and counts one claim for this user. |
| `list_my_coupons` | yes | This account's synced coupons, including codes they own, and why each is listed or not. Pass `product`. |
| `submit_product` | yes | Create a listing from `url` and `category`. Name and metadata filled from the page when omitted. |
| `connect_coupon_provider` | yes | `product`, `provider` (`stripe`, `paddle`, or `polar`), `token`. Imports. Does not publish. Codes only when `list_my_coupons` is also enabled. |
| `sync_coupons` | yes | Fetch again with the stored key. Does not publish. Codes only when `list_my_coupons` is also enabled. |
| `publish_coupon` | yes | `coupon_id`. Makes that imported coupon claimable. |
| `connect_proof_point` | yes | Turn on a proof-point provider for one product. Runs the first read. Returns `{ ok: true }` only. |
| `sync_proof_points` | yes | Read proof points again for one product. Returns `{ ok: true }` only. Confirm with `get_product`. |
| `list_wishes` | category and product, no; `mine`, yes | `category` for open wishes. `mine: true` for wishes on products this account submitted, optionally with `category` or `product`. |
| `create_wish` | yes | `body`, and `product` or `category`. Optional `target_percent`, `target_months`. |
| `list_categories` | no | Categories and subcategories. Submit with a subcategory slug, the one that has a parent. Use `other-software` when nothing else fits. |
| `submit_feedback` | yes | `kind` (`feature`, `issue`, or `friction`), `body`, optional `context`. No billing keys, SA JSON, or promotion codes. |

## Proof points

Never invent a reading. Attach a provider with `connect_proof_point`, then confirm with `get_product`.

`connect_proof_point` args: `product` (slug), `provider`, `token`, `cadence` (`daily` | `weekly` | `monthly`), `points` (array of `{ field_name, display_mode, sort_order? }` where `display_mode` is `exact` or `band`). Optional: `region` (CloudWatch, required), `monitor_id` (Better Stack), `canary_name` (CloudWatch), `check_id` (GCP Monitoring), `property_id` (GA4).

| `provider` | `field_name` | `token` | When to pass an extra id |
| --- | --- | --- | --- |
| `stripe` | `MRR` | Restricted Stripe `rk_` with Subscriptions read. Refuse `sk_`. Separate from the coupon key store. | — |
| `betterstack` | `Uptime` | Better Stack read-only API token. | `monitor_id` if zero or many monitors match the product host. |
| `cloudwatch` | `Uptime` | JSON string `{"accessKeyId":"AKIA…","secretAccessKey":"…"}`. IAM needs only `cloudwatch:GetMetricData` and `synthetics:DescribeCanaries`. | `region` always. `canary_name` if that region does not have exactly one canary. |
| `gcp-monitoring` | `Uptime` | Full service-account JSON. Role: Monitoring Viewer only. | `check_id` if zero or many uptime checks match the product host. |
| `google-analytics` | `Traffic` | Full service-account JSON. Grant its `client_email` Viewer on the GA4 property. Enable Analytics Data + Admin APIs in the same GCP project. | `property_id` (numeric) if the SA can see more than one property. |

Ambiguous resources: the tool returns an error that asks for the id. It does not list choices. Ask the founder for the id from their provider console, then retry with that field set.

Confirm: `get_product` → `proof_points`. Exact includes `value`. Band includes `label` (and `color` for uptime), not the number. Seekers and other agents only see proof points on a verified https listing.

Not on MCP: disconnect, cadence-only change, display-mode-only change, reorder. Re-call `connect_proof_point` with the full desired `points` and `cadence` to replace that provider's configuration. Disconnect only on the product page at dealpuffin.com.

Do not put keys or service-account JSON in `submit_feedback`, logs, or chat repeats.

## Eligibility

Listed:

- There is a promotion code a customer can type.
- The code is active.
- Stripe has not locked it to one customer.
- It is before the Stripe expiry and before any earlier Dealpuffin expiry.
- Stripe's cap and any tighter Dealpuffin cap still have room.
- The founder published it onto a Dealpuffin product. A coupon Stripe limited to product ids can only be published on a listing that carries one of those ids.

Held back, and still stored:

- Imported, not published.
- No promotion code.
- Locked to one Stripe customer.
- Inactive, expired, over a cap, or hidden.

One coupon with several codes is several offers. A leaked code can still work at Stripe after the Dealpuffin cap. Say that when you quote a cap.
