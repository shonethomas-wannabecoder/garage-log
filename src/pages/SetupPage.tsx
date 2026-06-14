export function SetupPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold">Connect Supabase</h1>
      <p className="mt-2 text-slate-400">
        Copy <code className="text-sky-300">.env.example</code> to{' '}
        <code className="text-sky-300">.env.local</code> and add your project URL and anon key.
      </p>
      <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-slate-300">
        <li>
          Create a project at{' '}
          <a href="https://supabase.com" className="text-sky-400 underline" target="_blank" rel="noreferrer">
            supabase.com
          </a>
        </li>
        <li>
          Run the SQL in <code className="text-sky-300">supabase/migrations/001_initial_schema.sql</code> in the
          SQL editor
        </li>
        <li>Restart <code className="text-sky-300">npm run dev</code></li>
      </ol>
    </div>
  )
}
