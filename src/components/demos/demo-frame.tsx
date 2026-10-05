/** An interactive demo in a sandboxed frame: scripts run, but without same-origin access (no cookies, no storage, no parent DOM). */
export function DemoFrame({ src, title }: { src: string; title: string }) {
  return (
    <div className="card overflow-hidden">
      <iframe src={src} title={title} sandbox="allow-scripts allow-forms allow-popups allow-modals"
        className="block h-[75dvh] w-full bg-white" loading="lazy" />
    </div>
  );
}
