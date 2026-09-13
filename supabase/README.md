# Database schema

- **`schema.sql`** — the canonical, full schema. Always current: paste it into a new Supabase project's **SQL Editor** and run it to recreate every table, foreign key, and RLS policy from scratch. This is what you use when standing up a new Supabase project for this app (or a copy of it for another project).
- **`migrations/`** — one dated `.sql` file per incremental change made after the initial schema (e.g. `2026-09-20_add_notes_column.sql`), containing only that change. This is a changelog of what was altered and when, applied by hand to a live project's SQL Editor.

## Making a schema change

1. Write the change (e.g. an `alter table` statement) as a new file in `migrations/`, named with the date and a short description.
2. Apply it to the live Supabase project.
3. Fold the same change into `schema.sql` so it keeps describing the full, current schema — never let `schema.sql` and the live database drift apart.

This split is what makes it possible to spin up a fresh Supabase project (for a new client, or after switching Supabase accounts) by running one file, while still keeping a record of the history of changes.
