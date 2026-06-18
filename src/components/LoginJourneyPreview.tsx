import type { ReactNode } from 'react'
import { Camera, Car, Check, ClipboardCheck, Home, ImagePlus, Search, Users } from 'lucide-react'

const STEPS = [
  {
    step: 1,
    title: 'Log',
    caption: 'Photograph the invoice right after service.',
  },
  {
    step: 2,
    title: 'Review',
    caption: 'Confirm what was read before you save.',
  },
  {
    step: 3,
    title: 'History',
    caption: 'Every visit stays on your timeline.',
  },
  {
    step: 4,
    title: 'Compare',
    caption: 'Check shop quotes against what you already had done.',
  },
] as const

type Tab = 'home' | 'log' | 'search' | 'cars' | 'family'

function MiniNav({ active }: { active: Tab }) {
  const items: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'log', label: 'Log', icon: Camera },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'cars', label: 'Cars', icon: Car },
    { id: 'family', label: 'Family', icon: Users },
  ]

  return (
    <div className="flex items-center justify-around border-t border-line bg-surface/80 px-1 py-1.5">
      {items.map(({ id, label, icon: Icon }) => (
        <div
          key={id}
          className={`flex flex-col items-center gap-0.5 text-[7px] font-medium ${
            active === id ? 'text-brand' : 'text-faint'
          }`}
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-full ${
              active === id ? 'bg-brand-soft' : ''
            }`}
          >
            <Icon size={11} strokeWidth={2} aria-hidden />
          </span>
          {label}
        </div>
      ))}
    </div>
  )
}

function MiniPhone({ activeTab, children }: { activeTab: Tab; children: ReactNode }) {
  return (
    <div className="mx-auto w-[200px] rounded-[1.6rem] border border-line-strong bg-surface p-1 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
      <div className="overflow-hidden rounded-[1.25rem] bg-bg">
        <div className="h-[268px] overflow-hidden">{children}</div>
        <MiniNav active={activeTab} />
      </div>
    </div>
  )
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[7px] text-faint">{label}</p>
      <p className="mt-0.5 rounded-md border border-line bg-surface px-1.5 py-1 text-[8px] font-medium text-content">
        {value}
      </p>
    </div>
  )
}

function LogScreen() {
  return (
    <div className="flex h-full flex-col px-2.5 pt-2.5">
      <p className="text-[11px] font-bold tracking-tight">Log a bill</p>
      <p className="mt-0.5 text-[7px] leading-snug text-muted">Scan or upload your repair invoice.</p>
      <div className="mt-3 grid grid-cols-2 gap-1.5">
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-brand py-2.5 text-[7px] font-semibold text-brand-fg">
          <Camera size={12} aria-hidden />
          Take photo
        </div>
        <div className="flex flex-col items-center justify-center gap-1 rounded-lg border border-line bg-surface py-2.5 text-[7px] font-semibold text-content">
          <ImagePlus size={12} aria-hidden />
          Choose files
        </div>
      </div>
      <div className="mt-2.5 rounded-lg border border-dashed border-line px-2 py-2 text-center">
        <p className="text-[7px] font-medium text-muted">Page 1 added</p>
        <p className="mt-0.5 text-[6px] text-faint">Add every page, then upload &amp; parse</p>
      </div>
      <div className="mt-auto rounded-lg bg-brand py-2 text-center text-[8px] font-semibold text-brand-fg">
        Upload &amp; parse
      </div>
    </div>
  )
}

function ReviewScreen() {
  return (
    <div className="flex h-full flex-col px-2.5 pt-2.5">
      <p className="text-[11px] font-bold tracking-tight">Review invoice</p>
      <p className="mt-0.5 text-[7px] text-muted">Fix anything before saving.</p>
      <div className="mt-2 space-y-1.5">
        <MiniField label="Service date" value="Mar 20, 2026" />
        <div className="grid grid-cols-2 gap-1.5">
          <MiniField label="Mileage" value="91,966 mi" />
          <MiniField label="Total" value="$406.63" />
        </div>
        <MiniField label="Shop" value="Onion Creek Volkswagen" />
      </div>
      <div className="mt-2 rounded-lg border border-line bg-surface px-2 py-1.5">
        <p className="text-[7px] font-medium">Engine oil service</p>
        <p className="text-[7px] text-faint">Oil &amp; fluids · $66.73</p>
      </div>
      <div className="mt-auto rounded-lg bg-brand py-2 text-center text-[8px] font-semibold text-brand-fg">
        Save visit
      </div>
    </div>
  )
}

function HistoryScreen() {
  return (
    <div className="flex h-full flex-col px-2.5 pt-2.5">
      <p className="text-[7px] font-medium uppercase tracking-wider text-faint">My garage</p>
      <p className="text-[11px] font-bold tracking-tight">Advisor check</p>
      <div className="mt-2 rounded-lg border border-line bg-surface px-2 py-1.5">
        <p className="text-[7px] text-faint">Vehicle</p>
        <p className="text-[8px] font-semibold">Passat (2020 Volkswagen)</p>
      </div>
      <div className="mt-2 rounded-lg bg-brand px-2 py-2 text-[7px] font-semibold text-brand-fg">
        <ClipboardCheck size={10} className="mb-0.5 inline" aria-hidden /> Compare a quote
      </div>
      <div className="mt-2 rounded-lg border border-line bg-surface px-2 py-1.5">
        <p className="text-[7px] font-semibold">Up next</p>
        <p className="mt-0.5 text-[7px] text-muted">100,000 mi standard maintenance</p>
        <p className="text-[6px] text-faint">In 8,034 mi</p>
      </div>
      <div className="mt-1.5 rounded-lg border border-line bg-surface px-2 py-1.5">
        <p className="text-[7px] font-semibold">Last service</p>
        <p className="text-[7px] text-muted">Mar 20 · Onion Creek VW</p>
      </div>
    </div>
  )
}

function CompareScreen() {
  return (
    <div className="flex h-full flex-col px-2.5 pt-2.5">
      <p className="text-[11px] font-bold tracking-tight">Compare a quote</p>
      <p className="mt-0.5 text-[7px] text-muted">At the shop? Check their list.</p>
      <div className="mt-2 space-y-1.5">
        <div className="rounded-lg border border-line bg-surface px-2 py-1.5">
          <p className="text-[8px] font-medium">Brake fluid flush</p>
          <p className="text-[7px] text-faint">$89</p>
          <span className="mt-1 inline-flex items-center gap-0.5 rounded-full bg-ok-soft px-1.5 py-0.5 text-[6px] font-semibold text-on-ok-soft">
            <Check size={8} aria-hidden />
            Done 3 mo ago
          </span>
        </div>
        <div className="rounded-lg border border-line bg-surface px-2 py-1.5">
          <p className="text-[8px] font-medium">Cabin filter</p>
          <p className="text-[7px] text-faint">$45</p>
          <span className="mt-1 inline-block rounded-full bg-warn-soft px-1.5 py-0.5 text-[6px] font-semibold text-on-warn-soft">
            Likely due
          </span>
        </div>
      </div>
      <p className="mt-auto text-center text-[6px] text-faint">Based on your logged history</p>
    </div>
  )
}

const SCREENS = [
  { screen: LogScreen, tab: 'log' as const },
  { screen: ReviewScreen, tab: 'log' as const },
  { screen: HistoryScreen, tab: 'home' as const },
  { screen: CompareScreen, tab: 'home' as const },
]

export function LoginJourneyPreview() {
  return (
    <section
      className="-mx-4 mt-12 border-t border-line bg-surface/40 px-4 pt-8 pb-2"
      aria-labelledby="journey-heading"
    >
      <div className="mx-auto max-w-md text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-faint">What to expect</p>
        <h2 id="journey-heading" className="mt-1 text-lg font-semibold text-content">
          How Garage Log works
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Four quick steps from invoice to accountability.
        </p>
      </div>

      <div className="relative mx-auto mt-6 max-w-lg">
        <div className="flex gap-3 overflow-x-auto px-1 pb-3 snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STEPS.map((item, index) => {
            const { screen: Screen, tab } = SCREENS[index]
            return (
              <figure key={item.step} className="w-[212px] shrink-0 snap-center">
                <div className="card flex flex-col items-center px-3 pb-3 pt-4">
                  <div className="mb-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-fg">
                    {item.step}
                  </div>
                  <MiniPhone activeTab={tab}>
                    <Screen />
                  </MiniPhone>
                  <figcaption className="mt-4 w-full text-center">
                    <p className="text-sm font-semibold text-content">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{item.caption}</p>
                  </figcaption>
                </div>
              </figure>
            )
          })}
        </div>
        <p className="text-center text-[11px] text-faint">Swipe to see all four steps</p>
      </div>
    </section>
  )
}
