---
id: ADR-0003
category: component
title: Database
status: accepted
superseded_by: null
component_id: comp_database
responsibility: Persistent store for catalog, carts, orders and accounts; runs on
  managed PostgreSQL (Amazon RDS).
kind: managed_service
split_reason: Backing service the project uses but does not build
evidence: 'human: "Managed PostgreSQL"'
---

## Context

human: "Managed PostgreSQL"

## Decision

Persistent store for catalog, carts, orders and accounts; runs on managed PostgreSQL (Amazon RDS).

Kept separate because Backing service the project uses but does not build.
