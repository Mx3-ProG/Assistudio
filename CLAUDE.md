@AGENTS.md

# STUDIO — project notes

- Read `README.md` first: architecture table, pipeline, routes.
- All data access goes through `src/lib/data/repo.ts`. Any new method must be implemented in BOTH `supabase.ts` and `demo.ts`.
- Financial state changes belong in SQL `SECURITY DEFINER` functions (audited), mirrored in `src/lib/commission.ts` (pure, tested). Keep them in sync.
- No business copy in components: add keys to `src/i18n/dictionaries/en.ts` (+ `fr.ts`, which is typed as complete).
- Never present pending/projected money as earned. Never add unsourced revenue/ROI claims.
- Demo data is dev-only and must stay clearly labelled.
