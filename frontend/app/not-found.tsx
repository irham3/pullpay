import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <span className="font-mono text-sm text-muted">404</span>
      <h1 className="text-2xl font-semibold tracking-tight text-text">
        Nothing here
      </h1>
      <p className="max-w-xs text-sm text-muted">
        This page or reward doesn&apos;t exist. It may have been refunded or
        never created.
      </p>
      <div className="mt-2 flex gap-3">
        <Button asChild>
          <Link href="/bounties">Browse rewards</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </main>
  );
}
