---
id: ADR-0009
category: cross_cutting
title: 'Cross-cutting: No compliance regime or data residency'
status: accepted
superseded_by: null
component_id: null
decision: 'No compliance regime (GDPR, PCI-DSS) or data-residency rule applies, so
  the single region is chosen on latency and cost. Baseline hygiene still applies:
  TLS in transit and encryption at rest on the managed database.'
evidence: 'human: "None"'
---

## Context

human: "None"

## Decision

No compliance regime (GDPR, PCI-DSS) or data-residency rule applies, so the single region is chosen on latency and cost. Baseline hygiene still applies: TLS in transit and encryption at rest on the managed database.
