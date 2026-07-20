---
name: saas-docs-picture
description: >-
  Builds a whole-picture understanding before architectural or design decisions.
  Starts from docs/Development, docs/Components, and docs/Software Patterns Docs
  as support documentation, then the rest of the repo (code, root docs, kit pins,
  shell package docs). Use when planning features, choosing patterns, reviewing
  architecture, dual-mode tenancy/billing, or when the user asks how the system
  fits together.
---

# SaaS docs picture

Before changing structure or picking an approach, **read support docs + the repo**—do not invent architecture from memory.

Respect **saas-kit-protect**: ~90% domain; ask before changing platform/shell kits.

## Support documentation (start here)

| Folder | Role |
|--------|------|
| `docs/Development/` | Architecture, dual-mode, epics |
| `docs/Components/` | Per-surface docs |
| `docs/Software Patterns Docs/` | Shared patterns (sync from package) |

```bash
npm i -D @llanesleonardo/software-patterns-docs
npx @llanesleonardo/create-saas sync-docs --dir .
```

## Also read the repo

Support docs **inform** decisions; **code + wiring** are ground truth.

- `README.md`, `docs/*.md` at repo root if present  
- `.cursor/rules/` (saas-kit-protect)  
- `src/` paths you will change (domain, routes, APIs)  
- `package.json` pins; `proxy.ts`, `src/lib/shell.ts`  
- Shell kit docs: `DUAL-MODE-TENANCY.md`, `APP-SHELL-LAYOUT.md` in `@llanesleonardo/saas-product-shell`

## Procedure

1. Development + Components + Patterns (targeted reads)  
2. Repo: code, pins, kit docs for the area  
3. Reply: whole picture · support docs · repo paths checked · recommendation · ask if kit changes

## Don’t

- Treat the three folders as the **only** sources  
- Decide from docs without checking implementation  
- Rewrite SaaS kit in-app without asking  
