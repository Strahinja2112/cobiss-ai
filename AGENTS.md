# Repository Guidelines

## Project Structure & Module Organization

This repository is a Create T3 App project using Next.js App Router and TypeScript. Pages and route handlers live in `src/app/`; shared UI lives in `src/components/`; styles live in `src/styles/`. Authentication is configured in `src/server/auth/`, and environment variable validation lives in `src/env.js`. Static files belong in `public/`. `old/` contains the earlier COBISS CLI and sample results; treat it as reference material while migrating scraper code. Prisma and tRPC scaffold files are present, but the current book-fetching feature does not use a database.

## Build, Test, and Development Commands

Use pnpm, as pinned in `package.json` and `pnpm-lock.yaml`. Run `pnpm install` to install dependencies, `pnpm dev` to start the local app, `pnpm typecheck` to check TypeScript, and `pnpm build` to create a production build. Run `pnpm format:check` before a pull request; `pnpm format:write` applies the configured Prettier style. Do not run Prisma migration commands unless a database change is part of the task.

## Coding Style & Naming Conventions

Use TypeScript with strict types and two-space indentation. Follow existing Prettier and Tailwind formatting. Name React components in PascalCase, route files `route.ts`, pages `page.tsx`, and ordinary modules in lowercase with descriptive names. Keep COBISS requests and parsing on the server; return only data needed by the page.

## Testing Guidelines

No test runner or coverage target is configured yet. For new parsing or pagination logic, add a focused test and document how to run it. At minimum, run `pnpm typecheck` and `pnpm build`; check authentication and fetching manually with local credentials when available.

## Commit & Pull Request Guidelines

Recent commits use short, informal imperative subjects; no enforced commit format exists. Write a specific subject such as `Add COBISS page streaming`. Pull requests should describe behavior, verification, required environment variables, and any known limit. Include screenshots for visible UI changes. Never commit `.env` or OAuth secrets; update `.env.example` when configuration changes.
