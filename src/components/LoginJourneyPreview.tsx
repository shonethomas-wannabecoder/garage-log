const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Cars',
    caption: 'Add every vehicle in your household — one garage, multiple cars.',
    image: '/journey/journey-1-add-vehicles.png',
    alt: 'Garage Log Cars screen with two vehicles listed and add vehicle form',
  },
  {
    step: 2,
    title: 'Log',
    caption: 'Photograph the invoice right after service.',
    image: '/journey/journey-2-log-bill.png',
    alt: 'Garage Log log service screen with take photo and choose files',
  },
  {
    step: 3,
    title: 'Review',
    caption: 'Confirm what was read before you save.',
    image: '/journey/journey-3-review-invoice.png',
    alt: 'Garage Log review invoice screen with shop mileage and line items',
  },
  {
    step: 4,
    title: 'History',
    caption: 'Every visit stays on your timeline.',
    image: '/journey/journey-4-home-history.png',
    alt: 'Garage Log home screen with last service and upcoming maintenance',
  },
  {
    step: 5,
    title: 'Compare',
    caption: 'Check shop quotes against what you already had done.',
    image: '/journey/journey-5-compare-quote.png',
    alt: 'Garage Log compare a quote screen with done recently badges',
  },
] as const

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
          Five quick steps from your cars to accountability.
        </p>
      </div>

      <div className="relative mx-auto mt-6 w-full max-w-lg">
        <div
          className="flex items-stretch gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{
            paddingInline: 'max(1rem, calc(50% - min(39vw, 7.5rem)))',
            scrollPaddingInline: 'max(1rem, calc(50% - min(39vw, 7.5rem)))',
          }}
        >
          {JOURNEY_STEPS.map((item) => (
            <figure
              key={item.step}
              className="flex w-[min(78vw,15rem)] shrink-0 snap-center flex-col"
            >
              <div className="card flex h-full flex-col p-3">
                <div className="mb-3 flex min-h-7 items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-fg">
                    {item.step}
                  </span>
                  <p className="text-sm font-semibold text-content">{item.title}</p>
                </div>

                <div className="aspect-[390/844] overflow-hidden rounded-xl border border-line bg-bg">
                  <img
                    src={item.image}
                    alt={item.alt}
                    width={390}
                    height={844}
                    loading="lazy"
                    className="h-full w-full object-cover object-top"
                  />
                </div>

                <figcaption className="mt-3 flex min-h-[2.75rem] items-start">
                  <p className="text-xs leading-relaxed text-muted">{item.caption}</p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
        <p className="text-center text-[11px] text-faint">Swipe to see all five steps</p>
      </div>
    </section>
  )
}
