const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Cars',
    caption: 'Add every vehicle with year, make, model, and optional VIN — then track costs per car.',
    image: '/journey/journey-1-add-vehicles.png',
    alt: 'Garage Log Cars screen with two vehicles listed and add vehicle form including VIN',
  },
  {
    step: 2,
    title: 'Log',
    caption: 'Photograph the invoice right after service — uploads queue if you’re offline.',
    image: '/journey/journey-2-log-bill.png',
    alt: 'Garage Log log service screen with take photo and choose files',
  },
  {
    step: 3,
    title: 'Review',
    caption: 'Confirm shop, mileage, and line items — edit visits later if something looks off.',
    image: '/journey/journey-3-review-invoice.png',
    alt: 'Garage Log review invoice screen with shop mileage and line items',
  },
  {
    step: 4,
    title: 'Up next',
    caption: 'Keep mileage current so factory schedules and reminders stay accurate.',
    image: '/journey/journey-4-home-history.png',
    alt: 'Garage Log home with current mileage, next factory service ring, and reminders',
  },
  {
    step: 5,
    title: 'Search',
    caption: 'Find past work by shop, invoice #, notes, dates, or line items.',
    image: '/journey/journey-5-search.png',
    alt: 'Garage Log search screen filtering visits by shop name',
  },
  {
    step: 6,
    title: 'Compare',
    caption: 'At the shop, check today’s quote against what you already paid for.',
    image: '/journey/journey-6-compare-quote.png',
    alt: 'Garage Log compare a quote screen with done recently badges',
  },
  {
    step: 7,
    title: 'Family',
    caption: 'Invite household members so everyone shares one garage log.',
    image: '/journey/journey-7-family.png',
    alt: 'Garage Log family screen with invite by email and pending invite',
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
          Seven steps from your cars to a shared garage of record.
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
        <p className="text-center text-[11px] text-faint">Swipe to see all seven steps</p>
      </div>
    </section>
  )
}
