export default function PageLoader({ label = 'Готовим страницу…' }: { label?: string }) {
  return <section className="page-loader" role="status" aria-live="polite">
    <div className="page-loader-mark" aria-hidden="true"><i /><i /><i /></div>
    <p>{label}</p>
  </section>
}
