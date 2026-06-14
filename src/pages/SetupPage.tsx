export function SetupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Connect Supabase</h1>
      <p className="mt-2 text-muted">
        Copy <code className="text-brand">.env.example</code> to{' '}
        <code className="text-brand">.env.local</code> and add your project URL and anon key.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-content">
        <li>
          Create a project at{' '}
          <a href="https://supabase.com" className="text-brand underline" target="_blank" rel="noreferrer">
            supabase.com
          </a>
        </li>
        <li>
          Run the SQL in <code className="text-brand">supabase/migrations/001_initial_schema.sql</code> in the
          SQL editor
        </li>
        <li>Restart <code className="text-brand">npm run dev</code></li>
      </ol>
    </div>
  )
}
