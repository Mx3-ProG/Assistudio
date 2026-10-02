export default function SalesCenterLoading() {
  return <div className="animate-pulse space-y-6" aria-busy="true">
    <div className="space-y-3">
      <div className="h-8 w-56 rounded-xl bg-surface-2" />
      <div className="h-4 max-w-xl rounded-lg bg-surface-2" />
    </div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-32 rounded-2xl border border-line bg-surface-2/70" />)}
    </div>
  </div>;
}
