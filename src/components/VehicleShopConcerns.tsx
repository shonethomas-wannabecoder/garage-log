import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useHousehold } from '../contexts/HouseholdContext'

export function VehicleShopConcerns() {
  const { vehicles, selectedVehicleId, updateVehicleShopConcerns } = useHousehold()
  const vehicle = vehicles.find((v) => v.id === selectedVehicleId)
  const [text, setText] = useState(vehicle?.shop_concerns ?? '')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    setText(vehicle?.shop_concerns ?? '')
    setStatus('idle')
  }, [vehicle?.id, vehicle?.shop_concerns])

  useEffect(() => {
    if (!vehicle) return
    const saved = vehicle.shop_concerns ?? ''
    if (text === saved) return

    setStatus('saving')
    const timer = window.setTimeout(() => {
      void (async () => {
        const result = await updateVehicleShopConcerns(vehicle.id, text.trim() || null)
        if (result.error) {
          setStatus('error')
          return
        }
        setStatus('saved')
        window.setTimeout(() => setStatus('idle'), 2000)
      })()
    }, 600)

    return () => window.clearTimeout(timer)
  }, [text, vehicle, updateVehicleShopConcerns])

  if (!vehicle) return null

  return (
    <section className="card space-y-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MessageSquare size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden />
          <div>
            <h2 className="text-sm font-semibold text-content">Concerns for next visit</h2>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              Symptoms or questions to bring up with the shop for {vehicle.nickname}.
            </p>
          </div>
        </div>
        {status === 'saving' && <span className="text-xs text-faint">Saving…</span>}
        {status === 'saved' && <span className="text-xs text-ok">Saved</span>}
        {status === 'error' && <span className="text-xs text-danger">Couldn&apos;t save</span>}
      </div>

      <textarea
        rows={3}
        className="field resize-y"
        placeholder="e.g. Grinding when braking, AC blows warm, check engine light on…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label={`Concerns for next visit for ${vehicle.nickname}`}
      />
    </section>
  )
}
