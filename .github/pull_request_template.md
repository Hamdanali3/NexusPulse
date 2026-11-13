## Summary

<!-- Describe what this pull request changes and why. Link any related issues below. -->

## Scope

- [ ] UI / Design tokens & components (`NexusPulse/src/components/`, `tokens.css`, `globals.css`)
- [ ] PayPal SDK / Gateway / Sandbox mirror (`NexusPulse/src/lib/paypal/`, `src/app/api/paypal/`)
- [ ] AI / RAG assistant (`NexusPulse/src/lib/ai/`, `src/app/api/ai/`)
- [ ] Database schema / persistence (`NexusPulse/src/lib/db/`, `scripts/migrate-supabase.mjs`)
- [ ] Documentation / GitHub workflows (`README.md`, `.github/`)

## Verification

Run these checks inside `NexusPulse/` before requesting review:

- [ ] `npm run lint` (`tsc --noEmit`) passes with 0 errors
- [ ] `npm test` passes (all tests green)
- [ ] `npm run build` succeeds cleanly without relying on local `.env.local` secrets
- [ ] UI changes verified across desktop (`1440px`), tablet (`768px`), and mobile (`375px`) viewports (screenshots attached if applicable)
- [ ] No secrets, `.env.local` values, or personal credentials included in diff
