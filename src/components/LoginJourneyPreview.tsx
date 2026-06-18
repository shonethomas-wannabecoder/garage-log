const JOURNEY_STEPS = [
  {
    step: 1,
    title: 'Log',
    caption: 'Snap your invoice after every visit.',
    image: '/journey/journey-1-log-bill.png',
    alt: 'Garage Log screen for photographing a repair invoice',
  },
  {
    step: 2,
    title: 'Review',
    caption: 'Confirm shop, mileage, and line items.',
    image: '/journey/journey-2-review-invoice.png',
    alt: 'Garage Log screen reviewing parsed invoice details',
  },
  {
    step: 3,
    title: 'History',
    caption: 'Your repair timeline, always handy.',
    image: '/journey/journey-3-home-history.png',
    alt: 'Garage Log home screen showing service history and upcoming maintenance',
  },
  {
    step: 4,
    title: 'Compare',
    caption: 'Push back when they recommend work you already paid for.',
    image: '/journey/journey-4-compare-quote.png',
    alt: 'Garage Log screen comparing shop recommendations against past service',
  },
] as const

export function LoginJourneyPreview() {
  return (
    <section className="mt-10 w-full" aria-labelledby="journey-heading">
      <div className="mx-auto max-w-md px-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-faint">What to expect</p>
        <h2 id="journey-heading" className="mt-1 text-lg font-semibold">
          A typical visit
        </h2>
        <p className="mt-1 text-sm text-muted">Swipe through how most people use Garage Log.</p>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {JOURNEY_STEPS.map((item) => (
          <figure
            key={item.step}
            className="w-[min(72vw,220px)] shrink-0 snap-center"
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lg">
              <img
                src={item.image}
                alt={item.alt}
                width={440}
                height={920}
                loading="lazy"
                className="aspect-[9/19] w-full object-cover object-top"
              />
            </div>
            <figcaption className="mt-2.5 text-center">
              <p className="text-sm font-semibold text-content">
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-on-brand-soft">
                  {item.step}
                </span>
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
