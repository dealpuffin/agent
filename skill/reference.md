# Dealpuffin tools

Remote MCP: `https://mcp.dealpuffin.com/mcp`. OAuth, or an API key from https://dealpuffin.com/stripe as `Authorization: Bearer`.

The HTTP API base is `DEALPUFFIN_API_BASE` or `https://dealpuffin.com`. Search and get do not need a key. Every other call does.

| Tool | Auth | What it does |
| --- | --- | --- |
| `search_offers` | no | `q` and `category` optional. Terms only. No code. |
| `get_offer` | no | One offer by id. No code. |
| `reveal_offer` | yes | Returns the code and counts one claim for this user. |
| `list_my_coupons` | yes | This account's synced coupons, including codes they own, and why each is listed or not. |
| `submit_product` | yes | `name`, `url`, `category`, `description`, `stripe_product_ids`. |
| `connect_stripe` | yes | `restricted_key`. Syncs. Response includes listed and held reasons. |
| `sync_coupons` | yes | Fetch again with the stored key. Does not publish. |
| `publish_coupon` | yes | `coupon_id` and `product` slug. Makes that imported coupon claimable on that listing. |
| `list_wishes` | no | `product` or `category`. |
| `create_wish` | yes | `body`, and `product` or `category`. Optional `target_percent`, `target_months`. |
| `list_categories` | no | Category slugs to use when submitting. |

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
