---
id: ADR-0005
category: nfr
title: "NFR: Scale (Storefront API) \u2014 500 concurrent users, 50 requests/s"
status: accepted
superseded_by: null
dimension: Scale
metric: Peak concurrent users / sustained request rate
threshold: 500 concurrent users, 50 requests/s
component_id: comp_storefront_api
needs_dedicated_tracking: true
evidence: "human: \"Not known yet \u2014 propose defaults\"; proposed: small-shop\
  \ default"
---

## Context

human: "Not known yet — propose defaults"; proposed: small-shop default

## Decision

Peak concurrent users / sustained request rate: 500 concurrent users, 50 requests/s

Applies to Storefront API.
