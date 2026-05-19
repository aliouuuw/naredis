# Ndouckmane Transit — MVP documentation

Planning docs for the operational logistics platform (freight forwarding / customs transit) targeting West Africa, initially Senegal.

## Documents

| Doc | Purpose |
|-----|---------|
| [Glossary — dossier vs déclaration](./00-glossary.md) | **Start here** — Notion mapping, UI vs code names |
| [Overview](./01-overview.md) | Product vision, users, domain vocabulary |
| [Stack](./02-stack.md) | Technology choices and hosting |
| [MVP scope](./03-mvp-scope.md) | What ships in v0, what is explicitly deferred |
| [Architecture](./04-architecture.md) | Monolith layout, modules, boundaries |
| [Domain model](./05-domain-model.md) | Entities, rules, state machines |
| [Data model](./06-data-model.md) | Tables, indexes, SQL views |
| [Auth](./07-auth.md) | Better Auth, organizations, RBAC |
| [Roadmap](./08-roadmap.md) | Phased delivery after MVP demo |
| [UX principles](./09-ux-principles.md) | Notion familiarity vs improvements |
| [Information architecture](./10-information-architecture.md) | Pages, layouts, navigation |
| [User flows](./11-user-flows.md) | Step-by-step flows by persona |
| [UI components](./12-ui-components.md) | shadcn patterns and component map |

## Project tracking (root)

| File | Purpose |
|------|---------|
| [`backlog.json`](../backlog.json) | Prioritized tasks with IDs, deps, acceptance criteria |
| [`progress.md`](../progress.md) | Current phase, decisions, what's done |

## How to use these docs

- Read **00-glossary** before **05-domain-model** (dossier = job, déclaration = customs filing).
- Treat **03-mvp-scope** and **05-domain-model** as the product contract for the first demo.
- Treat **06-data-model** as the schema contract — money and tenancy rules should not be “fixed later.”
- Update docs when an anchor client (commissionnaire / freight forwarder in Dakar) invalidates assumptions.

## Status

| Area | Status |
|------|--------|
| Next.js app scaffold | Done |
| Planning docs | Done |
| backlog.json + progress.md | Done |
| Database / Drizzle (local PG 17) | Not started |
| Better Auth | Not started |
| Core modules | Not started |
