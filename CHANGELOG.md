# Changelog

## 0.3.5

- Fix `sync-docs`: resolve `@llanesleonardo/software-patterns-docs` via package export (not `/package.json` subpath)
- Patterns pin: `@llanesleonardo/software-patterns-docs@0.1.1` (PeopleForms SEP #68)

## 0.3.4

Docs automation + shared patterns package:

- Scaffold **folder structure only**: `docs/Components`, `docs/Development`, `docs/Software Patterns Docs`
- Skill **saas-docs-picture** copied to `.cursor/skills/`
- Subcommand `sync-docs` + script `docs:sync-patterns` → `@llanesleonardo/software-patterns-docs@0.1.0`
- Pins: shell `0.2.5`, platform `0.3.0`, patterns-docs `0.1.0`

## 0.3.3

Default app chrome (PeopleForms-shaped, domain-agnostic) — shell `0.2.5`:

- Sidebar: **Product** (placeholder `/product/*`) · **Workspace** · **Account**
- Theme light/dark/system + workspace switcher in nav footer
- Tokens via `@llanesleonardo/saas-product-shell/ui/tokens.css`
- Template ships `.cursor/rules/saas-kit-protect.mdc` (ask before changing kit; ~90% domain)
- Pins: shell `0.2.5`, platform `0.3.0`

## 0.3.2

Dual-mode standards (aligned with PeopleForms + shell `0.2.4`):

- **Log In** copy; **Create admin** only when `needsSetup`; `/setup` redirects after first admin
- Proxy: `requireFirstAdmin` + `requireWorkspace`
- Nav (both modes): Members, API keys, Domains, Billing + workspaces switcher page
- API keys page via shell `ApiKeysPanel`; members list API stub; domains placeholder
- Pins: shell `0.2.4`, platform `0.3.0`

## 0.3.1

Dual-mode tenancy standards (aligned with PeopleForms + shell `0.2.3`):

- Template `proxy` uses `createShellProxy({ requireWorkspace })` — workspace required after login
- Template `/billing` — saas checkout vs selfhosted matrix + invoices (no checkout)
- Onboarding copy for department workspaces (Marketing / Sales / …)
- Pins: shell `0.2.3`, platform `0.3.0`

## 0.3.0

Epic 13 High + Medium automation:

- `--wizard` brand/env prompts; `--api-key-prefix`, `--rebrand`
- `--entity` / `add-domain` domain stubs (SQL + list + API, workspace_id TODOs)
- Scaffolded CI: typecheck + import-guard (blocks PeopleForms forks)
- `--with-stripe` / `--no-stripe`, `--with-clerk`, `--db postgres|sqlite|memory`
- `update-pins` subcommand for consumer package pins
- Default shell pin `0.2.2`, platform `0.3.0`

## 0.2.2

Prior scaffold release (deploy stubs, migrate path, env example).
