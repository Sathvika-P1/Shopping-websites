---
id: ADR-0002
category: component
title: Storefront API
status: accepted
superseded_by: null
component_id: comp_storefront_api
responsibility: Single API owning catalog, cart, orders and customer accounts for
  the storefront; one API for the whole domain in this first version.
kind: api_service
split_reason: Server runtime and data access, separate from the browser client
talks_to:
- component_id: comp_database
  interaction: sync
  evidence: 'proposed: API persists its data'
evidence: 'human: "Storefront web UI + API only, minimal first version"'
---

## Context

human: "Storefront web UI + API only, minimal first version"

## Decision

Single API owning catalog, cart, orders and customer accounts for the storefront; one API for the whole domain in this first version.

Kept separate because Server runtime and data access, separate from the browser client.

## Talks to

- **Database** (sync) — proposed: API persists its data
