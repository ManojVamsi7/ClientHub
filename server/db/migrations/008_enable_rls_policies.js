/**
 * Migration 008: Enable Row Level Security (RLS) on all public tables.
 *
 * WHY: Supabase Security Advisor flags tables where RLS is disabled as
 *      security errors. Although our app never uses the Supabase anon key
 *      or PostgREST API (all access goes through our Express server via a
 *      direct DATABASE_URL connection), enabling RLS with a permissive
 *      service-role bypass policy is best practice and silences the warnings.
 *
 * HOW RLS works with our architecture:
 *   - Our backend connects as the "postgres" superuser via DATABASE_URL.
 *   - Superusers BYPASS RLS entirely — no policies needed for the backend.
 *   - We still add explicit USING (true) policies so the tables are also
 *     accessible to the "authenticated" Supabase role if ever needed.
 *
 * SAFE TO RUN: Enabling RLS + adding permissive policies is non-destructive.
 * The backend continues to work identically.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Only run on PostgreSQL (production / Supabase)
  const isPostgres = knex.client.config.client === 'pg';
  if (!isPostgres) {
    console.log('Migration 008: Skipping RLS setup (not PostgreSQL)');
    return;
  }

  const tables = [
    'users',
    'clients',
    'client_queries',
    'interview_calls',
    'recruiter_mistakes',
    'students',
    'knex_migrations',
    'knex_migrations_lock',
  ];

  for (const table of tables) {
    // 1. Enable RLS on the table
    await knex.raw(`ALTER TABLE public.?? ENABLE ROW LEVEL SECURITY`, [table]);

    // 2. Drop policy if it already exists (idempotent re-runs)
    await knex.raw(
      `DROP POLICY IF EXISTS "backend_full_access" ON public.??`,
      [table]
    );

    // 3. Create a permissive policy for the authenticated role
    //    (covers both SELECT / INSERT / UPDATE / DELETE)
    await knex.raw(
      `CREATE POLICY "backend_full_access" ON public.??
       AS PERMISSIVE
       FOR ALL
       TO authenticated
       USING (true)
       WITH CHECK (true)`,
      [table]
    );

    console.log(`✅ RLS enabled + policy created for: ${table}`);
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  const isPostgres = knex.client.config.client === 'pg';
  if (!isPostgres) return;

  const tables = [
    'users',
    'clients',
    'client_queries',
    'interview_calls',
    'recruiter_mistakes',
    'students',
    'knex_migrations',
    'knex_migrations_lock',
  ];

  for (const table of tables) {
    await knex.raw(
      `DROP POLICY IF EXISTS "backend_full_access" ON public.??`,
      [table]
    );
    await knex.raw(`ALTER TABLE public.?? DISABLE ROW LEVEL SECURITY`, [table]);
    console.log(`↩️  RLS disabled for: ${table}`);
  }
};
