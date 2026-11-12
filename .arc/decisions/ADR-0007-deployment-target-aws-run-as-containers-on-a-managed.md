---
id: ADR-0007
category: deployment_target
title: "Deployment target: AWS, run as containers on a managed container service (ECS\
  \ on Fargate) behind a\u2026"
status: accepted
superseded_by: null
component_id: null
decision: AWS, run as containers on a managed container service (ECS on Fargate) behind
  a load balancer, with the web UI served as static assets via a CDN. Prod and staging
  environments, single region (region to be fixed once residency is answered); no
  multi-region topology.
evidence: "human: \"No hosting constraint \u2014 you recommend\"; proposed: managed\
  \ containers keep ops light for a minimal first version"
contested: true
alternatives_considered:
- 'Serverless (Lambda/Cloud Run): cheaper at idle but adds cold starts and per-platform
  constraints for a small team'
- 'VMs: more ops burden with no benefit at this scale'
- 'Azure/GCP: equally viable; no constraint favoured them'
consequences:
- Commits to AWS-native choices for the database and secrets
- Single region means a regional outage is an outage unless availability answer demands
  more
---

## Context

human: "No hosting constraint — you recommend"; proposed: managed containers keep ops light for a minimal first version

## Decision

AWS, run as containers on a managed container service (ECS on Fargate) behind a load balancer, with the web UI served as static assets via a CDN. Prod and staging environments, single region (region to be fixed once residency is answered); no multi-region topology.

## Alternatives considered

- Serverless (Lambda/Cloud Run): cheaper at idle but adds cold starts and per-platform constraints for a small team
- VMs: more ops burden with no benefit at this scale
- Azure/GCP: equally viable; no constraint favoured them

## Consequences

- Commits to AWS-native choices for the database and secrets
- Single region means a regional outage is an outage unless availability answer demands more
