import { useCallback, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '../components/ui'
import { supabase } from '../lib/supabase'
import type { WaitlistStatus } from '../types'

interface WaitlistRow {
  id: string
  email: string
  status: WaitlistStatus
  created_at: string
  approved_at: string | null
}

export function WaitlistAdminPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [rows, setRows] = useState<WaitlistRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const { data: admin } = await supabase.rpc('is_app_admin')
    if (!admin) {
      setAllowed(false)
      return
    }
    setAllowed(true)
    const { data, error: listError } = await supabase.rpc('list_waitlist_entries')
    if (listError) setError(listError.message)
    else setRows((data ?? []) as WaitlistRow[])
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function setStatus(id: string, status: WaitlistStatus) {
    setBusyId(id)
    setError(null)
    const { data, error: setErrorRpc } = await supabase.rpc('set_waitlist_status', {
      entry_id: id,
      next_status: status,
    })
    setBusyId(null)
    if (setErrorRpc) {
      setError(setErrorRpc.message)
      return
    }
    const row = data as { ok?: boolean; error?: string } | null
    if (!row?.ok) {
      setError(row?.error ?? 'Update failed')
      return
    }
    await refresh()
  }

  if (allowed === null) return <p className="text-muted">Checking access…</p>
  if (!allowed) return <Navigate to="/household" replace />

  return (
    <div className="space-y-5">
      <PageHeader title="Waitlist admin" subtitle="Approve or reject invite requests." />
      {error && <p className="text-sm text-danger">{error}</p>}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-content">{r.email}</p>
                <p className="text-xs text-faint">
                  {r.status} · joined {r.created_at.slice(0, 10)}
                </p>
              </div>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                {r.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busyId === r.id || r.status === 'approved'}
                className="btn-primary flex-1 py-2 text-sm"
                onClick={() => void setStatus(r.id, 'approved')}
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busyId === r.id || r.status === 'rejected'}
                className="btn-ghost flex-1 py-2 text-sm text-danger"
                onClick={() => void setStatus(r.id, 'rejected')}
              >
                Reject
              </button>
            </div>
          </li>
        ))}
        {!rows.length && <p className="text-sm text-muted">No waitlist entries yet.</p>}
      </ul>
    </div>
  )
}
