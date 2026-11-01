---
name: dealpuffin
description: >-
  Seeks and submits live Stripe coupons on Dealpuffin. Use when the user wants a
  SaaS discount, promo code, coupon, startup deal, or to list their own
  product's Stripe coupons for other people to claim.
---

# Dealpuffin

Deals are Stripe coupons Dealpuffin has synced. Never invent a discount or a code.

Connect to the remote MCP server at https://mcp.dealpuffin.com/mcp. OAuth signs the person in. A publisher can instead create an API key at https://dealpuffin.com/stripe and send it as the bearer token. The key is shown once.

## Seek

1. `search_offers` or `get_offer`. These never return the code. `code_hidden` is true.
2. Tell the user the terms: percent or amount, duration, Stripe cap, Dealpuffin cap, expiry, and the product URL.
3. `reveal_offer` when they want the code. That is their one claim. Calling it again returns the same code and does not count twice.
4. They paste the code at the product's own checkout. Dealpuffin does not apply it.

A code is listed only when the founder published that coupon, it has an active promotion code, Stripe has not locked that code to one customer, it is inside both expiries, and both caps still have room. Details are in [reference.md](reference.md).

## Submit

1. `submit_product` with name, https URL, category slug, and any Stripe product ids (`prod_...`).
2. Ask for a restricted key that starts with `rk_`. Refuse a secret key (`sk_`). It needs read access to Coupons and Promotion codes.
3. `connect_stripe` with that key. It imports coupons immediately and does not publish them. Do not log the key or repeat it back.
4. Read `listed` and `reasons`. Sync imports coupons and does not publish them. Say which ones are imported and which are held back, in the words the tool returns.
5. `publish_coupon` only for coupons the founder wants seekers to claim. Pass `coupon_id` and the product slug. A coupon Stripe limited to `prod_` ids can only be published on a listing that carries one of those ids.

A read key cannot turn on promotion codes at the provider's checkout. Say so if they expect the code to work there.

## Wishes

`create_wish` needs a product slug or a category slug, plus the words. Percent off and months free are optional. Do not send both targets empty of a product and a category.
