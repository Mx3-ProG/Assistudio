import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-4 text-center">
      <div>
        <p className="text-sm font-medium text-muted">404</p>
        <h1 className="display mt-3 text-4xl sm:text-6xl">STUDIO</h1>
        <p className="mt-4 text-muted">This page doesn’t exist.</p>
        <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-full bg-fg px-6 text-sm font-medium text-bg">
          Home
        </Link>
      </div>
    </main>
  );
}
