---
name: dealpuffin
description: >-
  Seeks and manages live SaaS coupons and proof points on Dealpuffin. Use when
  the user wants a promo code, startup deal, discount, to list or update their
  product, connect billing, publish coupons, attach MRR/uptime/traffic proof
  points, or leave a product review. On first use in a session, follow the
  Preamble so the installed copy matches metadata.version on main.
metadata:
  version: 1.1.6
  homepage: "https://dealpuffin.com"
  source: "https://github.com/dealpuffin/agent"
---

# Dealpuffin

## Preamble (once per session)

Run this the first time Dealpuffin work starts in a session, including when a bot loads this skill. Do not repeat it later in the same session. Do not ask permission.

**Skip it entirely when this skill is running from a Claude plugin** (the skill's directory path contains `/plugins/`, for example under `~/.claude/plugins/`). The plugin manager updates the plugin; running `npx skills` there would install a second copy.

1. Read `metadata.version` from this local `SKILL.md` (missing ⇒ `0.0.0`).
2. Fetch `https://raw.githubusercontent.com/dealpuffin/agent/main/skills/dealpuffin/SKILL.md` and read its `metadata.version`. On fetch failure, continue; retry next session.
3. Compare as numeric semver. If local ≥ remote, continue. Never downgrade.
4. If remote is newer:

   ```bash
   npx skills update dealpuffin -g -y
   ```

   Fallback: `npx skills add dealpuffin/agent -g -y`. Git checkout of the agent repo may `git pull --ff-only origin main` instead.
5. Re-read the new `SKILL.md` (and `reference.md` when needed). One short line if updated (`local → remote`); silence when current.

Bump `metadata.version` by the **patch** digit only on each published skill change (`x.y.Z` → `x.y.(Z+1)`). Keep `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` on the same version.

## Principles

Deals are coupons Dealpuffin synced from the founder’s billing provider. Proof points are readings from a provider. Do not invent a discount, code, or figure.

Connect to `https://mcp.dealpuffin.com/mcp` (OAuth or API key from https://dealpuffin.com/settings/api-keys). A key exposes only the tools turned on at creation. If a needed tool is missing, name it and stop.

Policy detail and every tool contract: [reference.md](reference.md).

## Seek

1. `search_offers` with `q` / `category`, or `id` for one offer. No codes. Public proof points may appear. `verification_status` is a quality signal (`verified` vs pending).
2. Tell the user the terms and product URL.
3. `reveal_offer` only when they want that code — one claim per coupon; repeats return the same code.
4. They paste the code at the product’s checkout. Dealpuffin does not apply it.

Filing wishes is website-only. Use `list_wishes` to read demand; do not invent a wish tool call.

## Submit and manage listing

1. `list_categories`, then `submit_product` with https `url` and a subcategory (`other-software` if nothing fits). Pass `free_for_now: true` when the product is free today (zero MRR then shows as Free for now). Ownership DNS verify is optional — listings are public on https while pending; `verify: true` later adds a Verified catalog tag.
2. Billing: ask for a read key — Stripe `rk_` (refuse `sk_`), Paddle `pdl_*` with `discount.read`, Polar `polar_oat_` with `discounts:read`, Lemon Squeezy API key (`store_id` if multi-store), Dodo `dodo_live_` / `dodo_test_` with Discounts read, or RevenueCat V2 secret with `discounts:read` (`project_id` if multi-project). `connect_coupon_provider` with `product`, `provider`, `token`. Omit `token` later to sync again. Do not log or echo the key.
3. Read returned eligibility. `publish_coupon` with `coupon_id` for coupons to list; `published: false` unpublishes; optional `claim_limit`.
4. Listing copy/media: `get_product`, then `update_product` with only changed fields. Screenshots: pass full set when changing — `{ id }` keep, `{ data }` upload base64/data URL. `hidden` toggles catalog visibility. `free_for_now` updates the free flag. `verify: true` re-checks DNS ownership (optional quality).
5. Optional Featured on Dealpuffin badge: owner `get_product` includes `badge.snippet`. Have the founder (or you) paste it on their site, then `update_product` with `verify_badge: true` (optional `badge_page_url` if not on the homepage). Catalog highlight applies only while the crawl finds the badge. After submit, Dealpuffin also emails the founder a badge nudge with the agent prompt and `/list/{slug}?tab=badge`.

## Proof points

Separate from coupons. Prefer `band` unless they want the number public. Use `hidden` to keep a field connected without showing it (for example one field from a multi-field provider).

1. `connect_proof_point` with provider, token/SA JSON, cadence, and `points` (`field_name` + `display_mode`). See reference for fields and credentials.
2. Confirm with `get_product` (connect returns `{ ok: true }` only). Exact includes `value`; band includes label only for non-owners — intended; hidden is omitted from public payloads.
3. Later changes: `update_proof_config` with `action` `sync`, `disconnect`, `cadence`, `mode`, or `order`.

Ambiguous monitor/property errors ask for an id — no chooser list. Ask the founder, retry with that field.

## Reviews

`create_review` with `product`, `stars` (1–5), and `body`. Pass `review_id` to reply. Load reviews from `get_product`.

## Feedback

On tool failure, confusion, or a missing capability, `submit_feedback` (`feature` | `issue` | `friction`). No billing keys, SA JSON, or promotion codes.
