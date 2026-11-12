---
id: ADR-0001
category: component
title: Storefront Web UI
status: accepted
superseded_by: null
component_id: comp_storefront_web_ui
responsibility: 'Customer-facing shopping site: browse catalog, cart, checkout, order
  views. Calls the Storefront API directly.'
kind: web_ui
split_reason: Browser client runtime, distinct from the API
talks_to:
- component_id: comp_storefront_api
  interaction: sync
  evidence: 'human: storefront web UI + API'
evidence: 'human: "Storefront web UI + API only, minimal first version"'
---

## Context

human: "Storefront web UI + API only, minimal first version"

## Decision

Customer-facing shopping site: browse catalog, cart, checkout, order views. Calls the Storefront API directly.

Kept separate because Browser client runtime, distinct from the API.

## Talks to

- **Storefront API** (sync) — human: storefront web UI + API
